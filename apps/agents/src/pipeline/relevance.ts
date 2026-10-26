import { cleanLine } from '../text';

// Is this a hackathon-type event? Platform categories are loose: Unstop's "hackathons"
// include fest events like drone races and robo soccer. The rule is conservative: when
// unsure, the event stays. It is turned away only when the title is clearly another
// kind of event (robotics and drone races, sports and esports, quizzes, cultural events,
// fest passes), or the source's tags are all robotics/drones/esports, and nothing in
// the title or tags says hackathon, ideathon, hack, code, build or a tech challenge.

/** Words that make it a hackathon-style event whatever else it mentions. */
const HACKATHON_TYPE =
  /\b(hack\w*|ideathons?|idea(thon| challenge| competition| pitch)|buildathons?|makeathons?|designathons?|datathons?|codathons?|codeathons?|code\w*|coding|programming|developers?|build|innovation (challenge|contest|competition)|apps? challenge|(ai|ml|data science|genai|app|software|product|design|ui ?\/? ?ux) (challenge|contest|competition|sprint)|case (study|competition|challenge)|pitch(ing)? (competition|contest|deck)|startup (challenge|competition|pitch)|ctf|capture the flag|machine learning|artificial intelligence|ai|genai|data science|analytics|blockchain|web3|software|web development|app development|cyber ?security)\b/i;

/** Titles that are clearly another kind of event. */
const OTHER_TITLE =
  /\b(robo ?(wars?|race|soccer|sumo|league)|robowars?|drones?|multirotors?|quadcopters?|rc (cars?|planes?|race)|aero ?model+ing|model rocketry|races?|racing|grand prix|line follower|soccer|football|cricket|basketball|volleyball|badminton|kabaddi|chess|athletics|sports meet|e-?sports?|gaming tournament|bgmi|valorant|free fire|quiz\w*|treasure hunt|cultural|dance|music|singing|battle of bands|photography|film making|short film|fashion|drama|theatre|poetry|painting|debate|fest pass(es)?|pro ?show)\b/i;

/** Source tags that only describe non-hackathon events (Unstop's tags for drone and robot contests). */
const OTHER_TAG = /\b(drone\w*|robotic\w*|robot\w*|multirotor|quadcopter|e-?sports?|online gaming|games? (and|&) sports|kinematics)\b/i;

/**
 * The reason an event isn't hackathon-type (from its title and the source's own tags),
 * or undefined when it is, or when it isn't clear (then it stays).
 */
export function notHackathonReason(title: string, tags: string[] = []): string | undefined {
  const t = cleanLine(title, 200);
  const cleanTags = tags.map((x) => cleanLine(x, 60)).filter(Boolean);
  if (HACKATHON_TYPE.test(t) || cleanTags.some((x) => HACKATHON_TYPE.test(x))) return undefined;
  const hit = t.match(OTHER_TITLE);
  if (hit) return `${NOT_HACKATHON} (${hit[0].toLowerCase()})`;
  const other = cleanTags.filter((x) => OTHER_TAG.test(x));
  if (other.length >= 2 && other.length >= cleanTags.length / 3) return `${NOT_HACKATHON} (${other[0].toLowerCase()})`;
  return undefined;
}

/** The fixed reason prefix, for finding these rejections later. */
export const NOT_HACKATHON = 'not a hackathon-type event';
