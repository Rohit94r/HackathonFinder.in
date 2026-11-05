/**
 * Event photos for the landing page, in public/photos. All are from Unsplash and free
 * to use under the Unsplash License (https://unsplash.com/license); we credit them anyway.
 */
export interface Photo {
  src: string;
  /** Photographer, as named on Unsplash. */
  by: string;
  /** The photo's Unsplash page. */
  page: string;
}

const photo = (file: string, by: string, id: string): Photo => ({
  src: `/photos/${file}.webp`,
  by,
  page: `https://unsplash.com/photos/${id}`,
});

export const PHOTOS = {
  aroundLaptop: photo('around-laptop', 'Videoters', 'OPABcW93ZY8'),
  beanbagLaptop: photo('beanbag-laptop', 'Nik', '73_kRzs9sqo'),
  classroomDesks: photo('classroom-desks', 'Faisal Qureshi', 'rwmYLRgkjsE'),
  codingContest: photo('coding-contest', 'algoleague', 'yYWOYeX-jLY'),
  collegeGroupProject: photo('college-group-project', 'Sanket Mishra', 'LCwo5opgr9M'),
  computerLab: photo('computer-lab', 'Haseeb Modi', 'LKySOH0mr38'),
  confetti: photo('confetti', 'Pablo Heimplatz', 'ZODcBkEohk8'),
  crowdAmazed: photo('crowd-amazed', 'Kaden Taylor', 'Y2kleFmGbV0'),
  crowdStairs: photo('crowd-stairs', 'Josh Marty', 'AF3Nq1rvAbI'),
  demoHall: photo('demo-hall', 'MD Duran', 'rE9vgD_TXgM'),
  eventGroup: photo('event-group', 'Raka Rahmadani', 'MHhYgNGLD0c'),
  expoHall: photo('expo-hall', 'Aaron Douglas', 'bOwyyNGwv5Q'),
  friendsLucknow: photo('friends-lucknow', 'Harsh Yadav', 'z6uFmwi9Efc'),
  groupSelfie: photo('group-selfie', 'Ashikul Islam Anik', 'PbCsWidkf4o'),
  lateNightCode: photo('late-night-code', 'Compagnons', 'Im_cQ6hQo10'),
  longTable: photo('long-table', 'Ewan Buck', 'xc9B3i-1QiI'),
  openHall: photo('open-hall', 'Alex Kotliarskyi', 'QBpZGqEMsKg'),
  purpleCrowd: photo('purple-crowd', 'Alfonso Scarpa', 'T1_8mbp5vDw'),
  sharedDesk: photo('shared-desk', 'Raka Rahmadani', 'rh4xapY-haI'),
  stageLights: photo('stage-lights', 'Markus Spiske', 'UCbMZ0S-w28'),
  stageTalk: photo('stage-talk', 'Alexandre Pellaes', '6vAjp0pscX0'),
  studentsLaptop: photo('students-laptop', 'Vitaly Gariev', '-X4Qx4_4iMU'),
  tablesLaptops: photo('tables-laptops', 'Christine Erispe', 'sIjqrd51grA'),
  teamLaptops: photo('team-laptops', 'Annie Spratt', 'QckxruozjRg'),
  teamTable: photo('team-table', 'Ofspace LLC', 'MdnVwNz_xdQ'),
  youngCoders: photo('young-coders', 'Evan Marvell', 'vG2SoCSpPEU'),
} satisfies Record<string, Photo>;
