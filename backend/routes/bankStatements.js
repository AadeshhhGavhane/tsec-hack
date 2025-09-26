const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { z } = require('zod');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Pinecone } = require('@pinecone-database/pinecone');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Initialize Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const assistantName = process.env.PINECONE_ASSISTANT_NAME || 'tsec-hacks';
const assistant = pc.Assistant(assistantName);

// Upload bank statement to Pinecone
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!process.env.PINECONE_API_KEY) {
      return res.status(500).json({ success: false, message: 'Pinecone API key not configured' });
    }

    const userId = req.userId;
    const originalPath = req.file.path;
    const originalName = req.file.originalname;
    
    // Create a new file path with proper extension for Pinecone
    const fileExtension = path.extname(originalName);
    const newFilePath = originalPath + fileExtension;
    
    // Rename the file to include the extension
    await fs.rename(originalPath, newFilePath);

    console.log('Uploading file:', {
      originalPath: originalPath,
      newFilePath: newFilePath,
      originalName: originalName,
      userId: userId,
      fileExists: require('fs').existsSync(newFilePath)
    });

    // Upload PDF directly to Pinecone Assistant (using exact format from example)
    const uploadResult = await assistant.uploadFile({
      path: newFilePath,
      metadata: {
        'user_id': String(userId),
        'upload_date': new Date().toISOString(),
        'document_type': 'bank_statement',
        'original_name': originalName
      }
    });
    
    console.log('Upload result:', uploadResult);

    // Clean up local file
    await fs.unlink(newFilePath);

    res.json({
      success: true,
      message: 'Bank statement uploaded successfully',
      data: {
        fileId: uploadResult.id,
        name: originalName
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file?.path) {
      try {
        const fileExtension = path.extname(req.file.originalname);
        const filePathWithExt = req.file.path + fileExtension;
        await fs.unlink(filePathWithExt);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload bank statement'
    });
  }
});

// List uploaded files
router.get('/files', authenticateToken, async (req, res) => {
  try {
    if (!process.env.PINECONE_API_KEY) {
      return res.status(500).json({ success: false, message: 'Pinecone API key not configured' });
    }

    const userId = req.userId;
    const filesResponse = await assistant.listFiles();
    
    console.log('Raw Pinecone files response:', JSON.stringify(filesResponse, null, 2));
    
    // Handle different response formats from Pinecone
    let files = [];
    if (Array.isArray(filesResponse)) {
      files = filesResponse;
    } else if (filesResponse && Array.isArray(filesResponse.files)) {
      files = filesResponse.files;
    } else if (filesResponse && filesResponse.data && Array.isArray(filesResponse.data)) {
      files = filesResponse.data;
    } else {
      console.log('Unexpected files response format:', filesResponse);
      files = [];
    }
    
    console.log('Parsed files array:', files.length, 'files');
    console.log('Files:', files.map(f => ({ id: f.id, name: f.name, metadata: f.metadata })));

    // Filter files by user ID (handle files without metadata)
    const userFiles = files.filter(file => {
      // If no metadata, include the file (for existing files uploaded before metadata was added)
      if (!file.metadata) {
        return true;
      }
      // Otherwise, check user_id and document_type
      return file.metadata.user_id === String(userId) && 
             file.metadata.document_type === 'bank_statement';
    });
    
    console.log('User ID:', userId);
    console.log('Filtered user files:', userFiles.length, 'files');
    console.log('User files:', userFiles.map(f => ({ id: f.id, name: f.name, metadata: f.metadata })));

    res.json({
      success: true,
      data: {
        files: userFiles
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list files'
    });
  }
});

// Delete a file
router.delete('/files/:fileId', authenticateToken, async (req, res) => {
  try {
    if (!process.env.PINECONE_API_KEY) {
      return res.status(500).json({ success: false, message: 'Pinecone API key not configured' });
    }

    const { fileId } = req.params;
    const userId = req.userId;

    // Verify file belongs to user before deletion
    const filesResponse = await assistant.listFiles();
    let files = [];
    if (Array.isArray(filesResponse)) {
      files = filesResponse;
    } else if (filesResponse && Array.isArray(filesResponse.files)) {
      files = filesResponse.files;
    } else if (filesResponse && filesResponse.data && Array.isArray(filesResponse.data)) {
      files = filesResponse.data;
    }
    const file = files.find(f => f.id === fileId);
    
    if (!file || (file.metadata && file.metadata.user_id !== String(userId))) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    await assistant.deleteFile(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file'
    });
  }
});

// Chat with a specific file
const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  }))
});

router.post('/chat/:fileId', authenticateToken, async (req, res) => {
  try {
    if (!process.env.PINECONE_API_KEY) {
      return res.status(500).json({ success: false, message: 'Pinecone API key not configured' });
    }

    const { fileId } = req.params;
    const userId = req.userId;
    const { messages } = ChatSchema.parse(req.body);

    // Verify file belongs to user
    const filesResponse = await assistant.listFiles();
    let files = [];
    if (Array.isArray(filesResponse)) {
      files = filesResponse;
    } else if (filesResponse && Array.isArray(filesResponse.files)) {
      files = filesResponse.files;
    } else if (filesResponse && filesResponse.data && Array.isArray(filesResponse.data)) {
      files = filesResponse.data;
    }
    const file = files.find(f => f.id === fileId);
    
    if (!file || (file.metadata && file.metadata.user_id !== String(userId))) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Chat with the file using Pinecone Assistant
    console.log('Chatting with file:', fileId, 'Messages:', messages);
    
    // Try different approaches based on Pinecone Assistant API
    let chatResponse;
    try {
      // Method 1: Direct chat (should automatically use uploaded files)
      chatResponse = await assistant.chat({
        messages: messages
      });
    } catch (error) {
      console.log('Method 1 failed, trying method 2:', error.message);
      try {
        // Method 2: Try with file context
        chatResponse = await assistant.chat({
          messages: messages,
          fileIds: [fileId]
        });
      } catch (error2) {
        console.log('Method 2 failed, trying method 3:', error2.message);
        // Method 3: Try different message format
        chatResponse = await assistant.chat({
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        });
      }
    }

    console.log('Chat response:', chatResponse);

    // Extract response content based on Pinecone Assistant response format
    let reply = 'No response from assistant';
    if (chatResponse) {
      if (chatResponse.message && chatResponse.message.content) {
        reply = chatResponse.message.content;
      } else if (chatResponse.content) {
        reply = chatResponse.content;
      } else if (typeof chatResponse === 'string') {
        reply = chatResponse;
      } else if (chatResponse.messages && chatResponse.messages[0]) {
        reply = chatResponse.messages[0].content || chatResponse.messages[0];
      }
    }

    res.json({
      success: true,
      data: {
        reply: reply
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to chat with file'
    });
  }
});

module.exports = router;
