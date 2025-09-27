import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  Star,
  Award,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react';
import { savingsChallengesAPI } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';

const SavingsChallenges = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: ''
  });
  const [joining, setJoining] = useState(null);
  const [leaving, setLeaving] = useState(null);

  useEffect(() => {
    loadChallengesData();
  }, []);

  const loadChallengesData = async () => {
    try {
      setLoading(true);
      const [availableResponse, myChallengesResponse, achievementsResponse, categoriesResponse] = await Promise.all([
        savingsChallengesAPI.getAvailable(filters.category, filters.difficulty),
        savingsChallengesAPI.getMyChallenges(),
        savingsChallengesAPI.getAchievements(),
        savingsChallengesAPI.getCategories()
      ]);

      if (availableResponse.success) {
        setAvailableChallenges(availableResponse.data.challenges);
      }

      if (myChallengesResponse.success) {
        setMyChallenges(myChallengesResponse.data.userChallenges);
      }

      if (achievementsResponse.success) {
        setAchievements(achievementsResponse.data.achievements);
        setTotalPoints(achievementsResponse.data.totalPoints);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data.categories);
      }
    } catch (error) {
      console.error('Error loading challenges data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      setJoining(challengeId);
      const response = await savingsChallengesAPI.joinChallenge(challengeId);
      
      if (response.success) {
        await loadChallengesData();
        alert('Successfully joined challenge!');
      } else {
        alert(response.message || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Join challenge error:', error);
      alert('Failed to join challenge');
    } finally {
      setJoining(null);
    }
  };

  const handleLeaveChallenge = async (challengeId) => {
    try {
      setLeaving(challengeId);
      const response = await savingsChallengesAPI.leaveChallenge(challengeId);
      
      if (response.success) {
        await loadChallengesData();
        alert('Successfully left challenge');
      } else {
        alert(response.message || 'Failed to leave challenge');
      }
    } catch (error) {
      console.error('Leave challenge error:', error);
      alert('Failed to leave challenge');
    } finally {
      setLeaving(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadChallengesData();
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'expert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-50 dark:bg-blue-100';
      case 'completed': return 'bg-green-50 dark:bg-green-100';
      case 'failed': return 'bg-red-50 dark:bg-red-100';
      case 'abandoned': return 'bg-gray-50 dark:bg-gray-100';
      default: return 'bg-gray-50 dark:bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play size={16} className="text-blue-600" />;
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'failed': return <XCircle size={16} className="text-red-600" />;
      case 'abandoned': return <Pause size={16} className="text-gray-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="w-16 h-16 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
        <p className="text-black font-black text-xl uppercase tracking-wide">Loading challenges...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Savings Challenges</h1>
        <p className="text-black font-bold text-lg">Complete challenges to build healthy financial habits and earn rewards!</p>
      </div>

      {/* Points Summary */}
      <div className="brutal-card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-100 dark:to-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 brutal-border brutal-shadow flex items-center justify-center">
              <Trophy size={24} className="text-black font-bold" />
            </div>
            <div>
              <div className="text-sm font-black text-black uppercase tracking-wide">Total Points</div>
              <div className="text-2xl font-black text-black">{totalPoints}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-black uppercase tracking-wide">Achievements</div>
            <div className="text-xl font-black text-black">{achievements.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 px-4 py-2 rounded-md font-black uppercase tracking-wide text-sm transition-all ${
            activeTab === 'available'
              ? 'bg-orange-500 text-black brutal-shadow'
              : 'text-black hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setActiveTab('my-challenges')}
          className={`flex-1 px-4 py-2 rounded-md font-black uppercase tracking-wide text-sm transition-all ${
            activeTab === 'my-challenges'
              ? 'bg-orange-500 text-black brutal-shadow'
              : 'text-black hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          My Challenges
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 px-4 py-2 rounded-md font-black uppercase tracking-wide text-sm transition-all ${
            activeTab === 'achievements'
              ? 'bg-orange-500 text-black brutal-shadow'
              : 'text-black hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Achievements
        </button>
      </div>

      {/* Filters for Available Challenges */}
      {activeTab === 'available' && (
        <div className="brutal-card p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 brutal-input font-bold uppercase tracking-wide text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce"
            >
              <Filter size={16} className="inline mr-2" />
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Available Challenges */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {availableChallenges.length > 0 ? (
            availableChallenges.map((challenge) => (
              <div key={challenge._id} className="brutal-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-black uppercase tracking-wide">{challenge.title}</h3>
                      <div className={`px-2 py-1 rounded text-xs font-black text-white ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty.toUpperCase()}
                      </div>
                    </div>
                    <p className="text-black font-bold mb-3">{challenge.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Target</div>
                        <div className="text-lg font-black text-black">{challenge.formattedTargetValue}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Duration</div>
                        <div className="text-lg font-black text-black">{challenge.duration} days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Reward</div>
                        <div className="text-lg font-black text-black">{challenge.reward.points} pts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Participants</div>
                        <div className="text-lg font-black text-black">{challenge.currentParticipants}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button
                      onClick={() => handleJoinChallenge(challenge._id)}
                      disabled={joining === challenge._id || !challenge.isJoinable}
                      className="px-4 py-2 bg-green-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 flex items-center gap-2"
                    >
                      {joining === challenge._id ? (
                        <div className="w-4 h-4 bg-green-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
                      ) : (
                        <>
                          <Play size={16} />
                          Join
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 uppercase tracking-wide">No Challenges Available</h3>
              <p className="text-black font-bold">Try adjusting your filters or check back later for new challenges!</p>
            </div>
          )}
        </div>
      )}

      {/* My Challenges */}
      {activeTab === 'my-challenges' && (
        <div className="space-y-4">
          {myChallenges.length > 0 ? (
            myChallenges.map((userChallenge) => (
              <div key={userChallenge._id} className={`brutal-card p-4 ${getStatusColor(userChallenge.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(userChallenge.status)}
                      <h3 className="text-lg font-black text-black uppercase tracking-wide">
                        {userChallenge.challengeId?.title}
                      </h3>
                      <div className={`px-2 py-1 rounded text-xs font-black text-white ${getDifficultyColor(userChallenge.challengeId?.difficulty)}`}>
                        {userChallenge.challengeId?.difficulty?.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm font-bold text-black mb-1">
                        <span>Progress</span>
                        <span>{Math.round(userChallenge.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(userChallenge.progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-black font-bold mt-1">
                        <span>{userChallenge.formattedCurrentValue}</span>
                        <span>{userChallenge.formattedTargetValue}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Streak</div>
                        <div className="text-lg font-black text-black">{userChallenge.streak.current}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Points</div>
                        <div className="text-lg font-black text-black">{userChallenge.totalPoints}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Achievements</div>
                        <div className="text-lg font-black text-black">{userChallenge.achievements.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-black uppercase tracking-wide">Started</div>
                        <div className="text-lg font-black text-black">
                          {new Date(userChallenge.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {userChallenge.status === 'active' && (
                    <div className="ml-4">
                      <button
                        onClick={() => handleLeaveChallenge(userChallenge.challengeId._id)}
                        disabled={leaving === userChallenge.challengeId._id}
                        className="px-4 py-2 bg-red-500 text-white font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 flex items-center gap-2"
                      >
                        {leaving === userChallenge.challengeId._id ? (
                          <div className="w-4 h-4 bg-red-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
                        ) : (
                          <>
                            <Pause size={16} />
                            Leave
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 uppercase tracking-wide">No Active Challenges</h3>
              <p className="text-black font-bold">Join some challenges to start building healthy financial habits!</p>
            </div>
          )}
        </div>
      )}

      {/* Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <div key={index} className="brutal-card p-4 bg-yellow-50 dark:bg-yellow-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500 brutal-border brutal-shadow flex items-center justify-center">
                    <Award size={24} className="text-black font-bold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-black uppercase tracking-wide">
                      {achievement.achievement.title}
                    </h3>
                    <p className="text-black font-bold">{achievement.achievement.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-black text-black uppercase tracking-wide">
                        Challenge: {achievement.challengeTitle}
                      </span>
                      <span className="text-sm font-black text-black">
                        +{achievement.achievement.points} points
                      </span>
                      <span className="text-xs text-black font-bold">
                        {new Date(achievement.achievement.earnedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 brutal-border brutal-shadow flex items-center justify-center mx-auto mb-4">
                <Trophy size={32} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 uppercase tracking-wide">No Achievements Yet</h3>
              <p className="text-black font-bold">Complete challenges to earn achievements and points!</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      {activeTab === 'available' && (
        <FloatingActionButton 
          onClick={() => loadChallengesData()}
          label="Refresh"
        />
      )}
    </div>
  );
};

export default SavingsChallenges;
