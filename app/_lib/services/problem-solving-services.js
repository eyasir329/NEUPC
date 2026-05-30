/**
 * @file Problem-solving platform services barrel. Implementation split by
 *   platform under ./problem-solving-services/* ; public API preserved here.
 */

export {
  API_ENDPOINTS,
  PLATFORMS,
  RATE_LIMITS,
} from './problem-solving-services/_shared';
export { ProblemSolvingAggregator } from './problem-solving-services/aggregator';
export { AtCoderService } from './problem-solving-services/atcoder';
export { CFGymService } from './problem-solving-services/cfgym';
export { ClistService } from './problem-solving-services/clist';
export { CodeChefService } from './problem-solving-services/codechef';
export { CodeforcesService } from './problem-solving-services/codeforces';
export { CSAcademyService } from './problem-solving-services/csacademy';
export { CSESService } from './problem-solving-services/cses';
export { EOlympService } from './problem-solving-services/eolymp';
export { HackerRankService } from './problem-solving-services/hackerrank';
export { KattisService } from './problem-solving-services/kattis';
export { LeetCodeService } from './problem-solving-services/leetcode';
export { LightOJService } from './problem-solving-services/lightoj';
export { SPOJService } from './problem-solving-services/spoj';
export { TopCoderService } from './problem-solving-services/topcoder';
export { TophService } from './problem-solving-services/toph';
export { USACOService } from './problem-solving-services/usaco';
export { UVAService } from './problem-solving-services/uva';
export { VJudgeService } from './problem-solving-services/vjudge';
export { default } from './problem-solving-services/aggregator';
