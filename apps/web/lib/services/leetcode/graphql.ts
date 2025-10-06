export const LEETCODE_FULL_STATS_QUERY = `
  query fullUserProfile($username: String!) {
  allQuestionsCount {
    difficulty
    count
  }
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
      userAvatar
      realName
      countryName
      school
      websites
      skillTags
      aboutMe
      company
      jobTitle
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    problemsSolvedBeatsStats {
      difficulty
      percentage
    }
    userCalendar {
      streak
      submissionCalendar
      dccBadges {
        timestamp
        badge {
          name
          icon
        }
      }
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
    badge {
      name
      icon
    }
  }
  userContestRankingHistory(username: $username) {
    contest {
      title
      startTime
    }
    problemsSolved
    totalProblems
    ranking
    rating
    trendDirection
  }
}
`;
