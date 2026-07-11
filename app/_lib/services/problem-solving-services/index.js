/**
 * @file Problem-solving platform services barrel. Implementation split by
 *   platform under ./problem-solving-services/* ; public API preserved here.
 */

export {
  API_ENDPOINTS,
  PLATFORMS,
  RATE_LIMITS,
} from './_shared';
export { ProblemSolvingAggregator } from './aggregator';
export { AtCoderService } from './atcoder';
export { CFGymService } from './cfgym';
export { ClistService } from './clist';
export { CodeChefService } from './codechef';
export { CodeforcesService } from './codeforces';
export { CSAcademyService } from './csacademy';
export { CSESService } from './cses';
export { EOlympService } from './eolymp';
export { HackerRankService } from './hackerrank';
export { KattisService } from './kattis';
export { LeetCodeService } from './leetcode';
export { LightOJService } from './lightoj';
export { SPOJService } from './spoj';
export { TopCoderService } from './topcoder';
export { TophService } from './toph';
export { USACOService } from './usaco';
export { UVAService } from './uva';
export { VJudgeService } from './vjudge';
export { default } from './aggregator';
