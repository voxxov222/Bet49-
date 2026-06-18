export interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

export interface LotterySystem {
  id: string;
  name: string;
  description: string;
  formula: string;
  schedule: string;
  draws: LottoDraw[];
}

export interface RegionGrid {
  id: string;
  name: string;
  flag: string;
  coordinate: string;
  lotteries: LotterySystem[];
}

export const REGIONS_DATABASE: RegionGrid[] = [
  {
    id: 'canada',
    name: 'Canada (Northern Matrix)',
    flag: '🇨🇦',
    coordinate: '56.1304° N, 106.3468° W',
    lotteries: [
      {
        id: 'ca-649-national',
        name: 'Canada Lotto 6/49 (National)',
        description: 'The premier national standard. Generates dual prize draws over the classic 1 to 49 sphere grid.',
        formula: '6 / 49 Standard Matrix',
        schedule: 'Wednesday & Saturday, 10:30 PM EST',
        draws: [
          { id: '1', date: '2026-06-10', numbers: [4, 15, 23, 27, 33, 41] },
          { id: '2', date: '2026-06-06', numbers: [12, 19, 21, 30, 42, 48] },
          { id: '3', date: '2026-06-03', numbers: [2, 16, 27, 33, 39, 45] },
          { id: '4', date: '2026-05-30', numbers: [8, 14, 25, 28, 36, 49] },
          { id: '5', date: '2026-05-27', numbers: [5, 11, 20, 31, 37, 44] },
          { id: '6', date: '2026-05-23', numbers: [1, 15, 22, 29, 32, 40] },
          { id: '7', date: '2026-05-20', numbers: [9, 13, 24, 38, 41, 47] },
          { id: '8', date: '2026-05-16', numbers: [6, 17, 26, 30, 34, 42] },
          { id: '9', date: '2026-05-13', numbers: [10, 18, 21, 35, 43, 46] },
          { id: '10', date: '2026-05-09', numbers: [3, 12, 27, 31, 39, 48] },
          { id: '11', date: '2026-05-06', numbers: [7, 16, 25, 28, 33, 44] },
          { id: '12', date: '2026-05-02', numbers: [11, 20, 24, 29, 37, 41] },
          { id: '13', date: '2026-04-29', numbers: [5, 14, 22, 30, 35, 49] },
          { id: '14', date: '2026-04-25', numbers: [8, 18, 23, 31, 40, 47] },
          { id: '15', date: '2026-04-22', numbers: [2, 15, 21, 27, 36, 45] }
        ]
      },
      {
        id: 'ca-qc-astro',
        name: 'Quebec Astro-6 (Eastern QC)',
        description: 'Provincial sequence synchronized against astrological and spatial coordinates.',
        formula: '6 / 49 Celestial Grid',
        schedule: 'Tuesday & Friday, 10:15 PM EST',
        draws: [
          { id: '1', date: '2026-06-09', numbers: [1, 13, 22, 26, 35, 40] },
          { id: '2', date: '2026-06-05', numbers: [7, 18, 20, 33, 41, 47] },
          { id: '3', date: '2026-06-02', numbers: [3, 11, 25, 29, 38, 44] },
          { id: '4', date: '2026-05-29', numbers: [5, 14, 21, 30, 36, 49] },
          { id: '5', date: '2026-05-26', numbers: [9, 17, 24, 28, 37, 45] },
          { id: '6', date: '2026-05-22', numbers: [2, 10, 19, 31, 40, 48] },
          { id: '7', date: '2026-05-19', numbers: [6, 12, 23, 27, 34, 43] },
          { id: '8', date: '2026-05-15', numbers: [8, 15, 22, 32, 39, 46] },
          { id: '9', date: '2026-05-12', numbers: [4, 16, 20, 29, 35, 41] },
          { id: '10', date: '2026-05-08', numbers: [11, 18, 25, 30, 38, 47] },
          { id: '11', date: '2026-05-05', numbers: [3, 10, 17, 26, 33, 44] },
          { id: '12', date: '2026-05-01', numbers: [7, 14, 21, 28, 35, 42] },
          { id: '13', date: '2026-04-28', numbers: [1, 9, 16, 23, 32, 49] },
          { id: '14', date: '2026-04-24', numbers: [5, 12, 19, 30, 37, 45] },
          { id: '15', date: '2026-04-21', numbers: [2, 8, 15, 24, 34, 41] }
        ]
      },
      {
        id: 'ca-western',
        name: 'Western 6/49 (Prairie Net)',
        description: 'Covering Alberta, Manitoba, Saskatchewan, and territories on prairie resonance feeds.',
        formula: '6 / 49 Geocentric Range',
        schedule: 'Wednesday & Saturday, 10:45 PM MST',
        draws: [
          { id: '1', date: '2026-06-10', numbers: [9, 14, 21, 28, 35, 42] },
          { id: '2', date: '2026-06-06', numbers: [2, 11, 17, 26, 33, 49] },
          { id: '3', date: '2026-06-03', numbers: [5, 13, 20, 30, 38, 44] },
          { id: '4', date: '2026-05-30', numbers: [8, 15, 23, 29, 37, 41] },
          { id: '5', date: '2026-05-27', numbers: [1, 10, 19, 27, 36, 45] },
          { id: '6', date: '2026-05-23', numbers: [6, 12, 18, 25, 34, 43] },
          { id: '7', date: '2026-05-20', numbers: [3, 14, 22, 31, 40, 48] },
          { id: '8', date: '2026-05-16', numbers: [7, 16, 24, 32, 39, 47] },
          { id: '9', date: '2026-05-13', numbers: [4, 11, 17, 28, 35, 41] },
          { id: '10', date: '2026-05-09', numbers: [10, 15, 23, 30, 38, 46] },
          { id: '11', date: '2026-05-06', numbers: [2, 8, 16, 25, 33, 42] },
          { id: '12', date: '2026-05-02', numbers: [5, 12, 21, 29, 37, 44] },
          { id: '13', date: '2026-04-29', numbers: [1, 7, 14, 22, 30, 49] },
          { id: '14', date: '2026-04-25', numbers: [6, 13, 20, 28, 35, 41] },
          { id: '15', date: '2026-04-22', numbers: [3, 9, 18, 26, 32, 45] }
        ]
      },
      {
        id: 'ca-on-lottario',
        name: 'Ontario Lottario 6/49 (Great Lakes)',
        description: 'Ontario provincial legend. A highly stable local pool established on classical seed vectors.',
        formula: '6 / 49 Lake Basin Frequency',
        schedule: 'Saturday Only, 10:30 PM EST',
        draws: [
          { id: '1', date: '2026-06-13', numbers: [3, 14, 21, 25, 33, 40] },
          { id: '2', date: '2026-06-06', numbers: [7, 11, 20, 31, 39, 48] },
          { id: '3', date: '2026-05-30', numbers: [1, 10, 18, 27, 35, 44] },
          { id: '4', date: '2026-05-23', numbers: [5, 15, 22, 29, 37, 41] },
          { id: '5', date: '2026-05-16', numbers: [9, 13, 24, 30, 36, 45] },
          { id: '6', date: '2026-05-09', numbers: [2, 12, 19, 28, 34, 49] },
          { id: '7', date: '2026-05-02', numbers: [6, 16, 23, 32, 38, 47] },
          { id: '8', date: '2026-04-25', numbers: [8, 14, 25, 33, 41, 46] },
          { id: '9', date: '2026-04-18', numbers: [4, 11, 17, 26, 32, 43] },
          { id: '10', date: '2026-04-11', numbers: [10, 18, 22, 29, 37, 42] },
          { id: '11', date: '2026-04-04', numbers: [3, 9, 15, 24, 30, 41] },
          { id: '12', date: '2026-03-28', numbers: [7, 13, 21, 28, 35, 49] },
          { id: '13', date: '2026-03-21', numbers: [1, 8, 14, 23, 31, 40] },
          { id: '14', date: '2026-03-14', numbers: [5, 12, 19, 27, 36, 45] },
          { id: '15', date: '2026-03-07', numbers: [2, 10, 17, 26, 34, 43] }
        ]
      }
    ]
  },
  {
    id: 'usa',
    name: 'United States (North American Grid)',
    flag: '🇺🇸',
    coordinate: '37.0902° N, 95.7129° W',
    lotteries: [
      {
        id: 'us-classic-649',
        name: 'USA Classic Pick-6 6/49',
        description: 'Classic American state system. Traces standard probability zones with extreme precision.',
        formula: '6 / 49 Standard Matrix',
        schedule: 'Monday & Thursday, 11:00 PM EST',
        draws: [
          { id: '1', date: '2026-06-12', numbers: [1, 9, 14, 28, 38, 45] },
          { id: '2', date: '2026-06-08', numbers: [6, 12, 19, 31, 40, 48] },
          { id: '3', date: '2026-06-05', numbers: [3, 11, 24, 29, 35, 41] },
          { id: '4', date: '2026-06-01', numbers: [8, 17, 22, 33, 39, 44] },
          { id: '5', date: '2026-05-29', numbers: [2, 15, 20, 26, 32, 49] },
          { id: '6', date: '2026-05-25', numbers: [7, 10, 25, 30, 37, 43] },
          { id: '7', date: '2026-05-22', numbers: [5, 13, 18, 27, 36, 42] },
          { id: '8', date: '2026-05-18', numbers: [11, 14, 23, 31, 41, 46] },
          { id: '9', date: '2026-05-15', numbers: [4, 12, 19, 28, 34, 40] },
          { id: '10', date: '2026-05-11', numbers: [9, 16, 21, 30, 38, 47] },
          { id: '11', date: '2026-05-08', numbers: [1, 8, 15, 24, 33, 45] },
          { id: '12', date: '2026-05-04', numbers: [6, 13, 22, 29, 39, 48] },
          { id: '13', date: '2026-05-01', numbers: [2, 10, 17, 25, 35, 41] },
          { id: '14', date: '2026-04-27', numbers: [7, 12, 20, 31, 37, 44] },
          { id: '15', date: '2026-04-24', numbers: [3, 14, 18, 26, 32, 49] }
        ]
      },
      {
        id: 'us-ny-lotto',
        name: 'New York Classic Pick-6',
        description: 'New York state’s classic pick-6, mapping major urban spatial recurrence indices.',
        formula: '6 / 49 Metropolitan Vector',
        schedule: 'Wednesday & Saturday, 11:21 PM EST',
        draws: [
          { id: '1', date: '2026-06-10', numbers: [5, 12, 23, 29, 34, 41] },
          { id: '2', date: '2026-06-06', numbers: [1, 11, 18, 25, 32, 47] },
          { id: '3', date: '2026-06-03', numbers: [8, 14, 21, 30, 39, 44] },
          { id: '4', date: '2026-05-30', numbers: [4, 13, 20, 27, 33, 49] },
          { id: '5', date: '2026-05-27', numbers: [9, 15, 24, 28, 35, 43] },
          { id: '6', date: '2026-05-23', numbers: [2, 10, 17, 26, 31, 40] },
          { id: '7', date: '2026-05-20', numbers: [7, 16, 22, 29, 38, 45] },
          { id: '8', date: '2026-05-16', numbers: [3, 12, 19, 30, 37, 48] },
          { id: '9', date: '2026-05-13', numbers: [6, 14, 21, 28, 36, 42] },
          { id: '10', date: '2026-05-09', numbers: [11, 15, 23, 31, 40, 46] },
          { id: '11', date: '2026-05-06', numbers: [1, 8, 14, 22, 33, 41] },
          { id: '12', date: '2026-05-02', numbers: [5, 10, 19, 27, 34, 49] },
          { id: '13', date: '2026-04-29', numbers: [3, 12, 18, 25, 32, 44] },
          { id: '14', date: '2026-04-25', numbers: [7, 13, 20, 29, 35, 42] },
          { id: '15', date: '2026-04-22', numbers: [2, 9, 16, 24, 30, 45] }
        ]
      },
      {
        id: 'us-tx-lotto',
        name: 'Texas Lotto Texas 6/49',
        description: 'Lone star state selection vector. High dispersion density profiles are common.',
        formula: '6 / 49 Meridional Lattice',
        schedule: 'Monday, Wednesday & Saturday, 10:12 PM CST',
        draws: [
          { id: '1', date: '2026-06-10', numbers: [7, 13, 22, 28, 35, 46] },
          { id: '2', date: '2026-06-08', numbers: [2, 10, 18, 24, 33, 41] },
          { id: '3', date: '2026-06-06', numbers: [9, 15, 21, 30, 39, 44] },
          { id: '4', date: '2026-06-03', numbers: [4, 11, 17, 26, 32, 49] },
          { id: '5', date: '2026-06-01', numbers: [8, 14, 23, 29, 37, 45] },
          { id: '6', date: '2026-05-30', numbers: [1, 12, 19, 27, 36, 40] },
          { id: '7', date: '2026-05-27', numbers: [6, 16, 20, 25, 34, 41] },
          { id: '8', date: '2026-05-25', numbers: [3, 10, 15, 22, 31, 48] },
          { id: '9', date: '2026-05-23', numbers: [8, 13, 21, 28, 35, 42] },
          { id: '10', date: '2026-05-20', numbers: [11, 14, 23, 29, 37, 47] },
          { id: '11', date: '2026-05-18', numbers: [2, 7, 16, 24, 33, 45] },
          { id: '12', date: '2026-05-16', numbers: [5, 12, 19, 30, 38, 44] },
          { id: '13', date: '2026-05-13', numbers: [1, 9, 17, 26, 34, 43] },
          { id: '14', date: '2026-05-11', numbers: [6, 11, 20, 27, 36, 49] },
          { id: '15', date: '2026-05-09', numbers: [3, 10, 18, 25, 32, 41] }
        ]
      }
    ]
  },
  {
    id: 'europe',
    name: 'Europe (Union Coordinate Lattices)',
    flag: '🇪🇺',
    coordinate: '48.5260° N, 15.2551° E',
    lotteries: [
      {
        id: 'eu-classic-649',
        name: 'Euro Classic 6/49 (Continental)',
        description: 'Pan-European classic. Uses specialized prime distribution weighting grids.',
        formula: '6 / 49 Unified Axis',
        schedule: 'Tuesday & Friday, 21:00 CET',
        draws: [
          { id: '1', date: '2026-06-13', numbers: [5, 12, 18, 29, 35, 43] },
          { id: '2', date: '2026-06-10', numbers: [2, 11, 23, 31, 39, 48] },
          { id: '3', date: '2026-06-06', numbers: [8, 14, 20, 27, 36, 42] },
          { id: '4', date: '2026-06-03', numbers: [1, 9, 15, 28, 33, 45] },
          { id: '5', date: '2026-05-30', numbers: [6, 13, 21, 30, 40, 47] },
          { id: '6', date: '2026-05-27', numbers: [3, 10, 19, 25, 34, 41] },
          { id: '7', date: '2026-05-23', numbers: [7, 16, 22, 29, 37, 44] },
          { id: '8', date: '2026-05-20', numbers: [4, 12, 17, 26, 35, 49] },
          { id: '9', date: '2026-05-16', numbers: [9, 15, 24, 32, 38, 43] },
          { id: '10', date: '2026-05-13', numbers: [2, 8, 14, 23, 31, 40] },
          { id: '11', date: '2026-05-09', numbers: [5, 11, 20, 28, 36, 46] },
          { id: '12', date: '2026-05-06', numbers: [1, 10, 18, 25, 33, 42] },
          { id: '13', date: '2026-05-02', numbers: [6, 12, 19, 27, 35, 45] },
          { id: '14', date: '2026-04-29', numbers: [3, 9, 16, 22, 30, 39] },
          { id: '15', date: '2026-04-25', numbers: [7, 13, 21, 28, 34, 48] }
        ]
      },
      {
        id: 'eu-german-649',
        name: 'German Lotto 6aus49',
        description: 'Germany’s national benchmark. Exceptional geometric symmetry in draw occurrences.',
        formula: '6 / 49 Rhineland Constant',
        schedule: 'Wednesday & Saturday, 18:25 CET',
        draws: [
          { id: '1', date: '2026-06-10', numbers: [3, 11, 19, 26, 35, 44] },
          { id: '2', date: '2026-06-06', numbers: [9, 14, 22, 30, 37, 48] },
          { id: '3', date: '2026-06-03', numbers: [1, 8, 15, 24, 33, 40] },
          { id: '4', date: '2026-05-30', numbers: [5, 12, 20, 28, 36, 45] },
          { id: '5', date: '2026-05-27', numbers: [2, 10, 17, 25, 31, 49] },
          { id: '6', date: '2026-05-23', numbers: [6, 13, 21, 29, 34, 42] },
          { id: '7', date: '2026-05-20', numbers: [4, 9, 18, 27, 38, 47] },
          { id: '8', date: '2026-05-16', numbers: [10, 15, 23, 31, 40, 46] },
          { id: '9', date: '2026-05-13', numbers: [1, 7, 14, 22, 30, 41] },
          { id: '10', date: '2026-05-09', numbers: [5, 11, 19, 26, 33, 44] },
          { id: '11', date: '2026-05-06', numbers: [2, 9, 16, 23, 32, 49] },
          { id: '12', date: '2026-05-02', numbers: [7, 12, 21, 28, 35, 43] },
          { id: '13', date: '2026-04-29', numbers: [3, 10, 17, 24, 34, 40] },
          { id: '14', date: '2026-04-25', numbers: [8, 14, 20, 27, 36, 45] },
          { id: '15', date: '2026-04-22', numbers: [1, 6, 12, 19, 30, 39] }
        ]
      }
    ]
  },
  {
    id: 'east',
    name: 'The East & Oceania (Pacific Grid)',
    flag: '🌏',
    coordinate: '22.3193° N, 114.1694° E',
    lotteries: [
      {
        id: 'as-hk-mark6',
        name: 'Hong Kong Mark Six 6/49',
        description: 'Elite Asian syndicate draw. Rich Vortex structural numbers are historically evident.',
        formula: '6 / 49 Golden Helix',
        schedule: 'Tuesday & Thursday, 21:15 HKT',
        draws: [
          { id: '1', date: '2026-06-11', numbers: [2, 12, 19, 22, 31, 44] },
          { id: '2', date: '2026-06-09', numbers: [5, 14, 25, 30, 38, 43] },
          { id: '3', date: '2026-06-04', numbers: [8, 11, 20, 28, 33, 49] },
          { id: '4', date: '2026-06-02', numbers: [1, 6, 17, 26, 35, 41] },
          { id: '5', date: '2026-05-28', numbers: [3, 10, 15, 29, 39, 45] },
          { id: '6', date: '2026-05-26', numbers: [7, 13, 21, 32, 40, 48] },
          { id: '7', date: '2026-05-21', numbers: [4, 9, 18, 27, 36, 42] },
          { id: '8', date: '2026-05-19', numbers: [11, 16, 23, 31, 37, 47] },
          { id: '9', date: '2026-05-14', numbers: [2, 8, 14, 24, 34, 40] },
          { id: '10', date: '2026-05-12', numbers: [6, 12, 20, 28, 35, 46] },
          { id: '11', date: '2026-05-07', numbers: [1, 9, 15, 22, 33, 44] },
          { id: '12', date: '2026-05-05', numbers: [3, 10, 19, 25, 38, 41] },
          { id: '13', date: '2026-04-30', numbers: [5, 13, 18, 29, 36, 45] },
          { id: '14', date: '2026-04-28', numbers: [8, 14, 21, 30, 37, 48] },
          { id: '15', date: '2026-04-23', numbers: [2, 7, 11, 26, 34, 49] }
        ]
      },
      {
        id: 'as-sg-toto',
        name: 'Singapore Toto 6/49',
        description: 'Singapore national Toto mapping, configured on highly centralized frequency lattices.',
        formula: '6 / 49 Centralized SingaPool',
        schedule: 'Monday & Thursday, 18:30 SGT',
        draws: [
          { id: '1', date: '2026-06-11', numbers: [4, 11, 21, 25, 36, 43] },
          { id: '2', date: '2026-06-08', numbers: [1, 9, 18, 27, 33, 48] },
          { id: '3', date: '2026-06-04', numbers: [6, 12, 20, 29, 35, 41] },
          { id: '4', date: '2026-06-01', numbers: [3, 10, 17, 26, 34, 49] },
          { id: '5', date: '2026-05-28', numbers: [7, 15, 22, 28, 38, 44] },
          { id: '6', date: '2026-05-25', numbers: [2, 11, 19, 30, 37, 45] },
          { id: '7', date: '2026-05-21', numbers: [5, 13, 24, 31, 39, 42] },
          { id: '8', date: '2026-05-18', numbers: [8, 14, 23, 32, 40, 47] },
          { id: '9', date: '2026-05-14', numbers: [9, 16, 21, 27, 35, 41] },
          { id: '10', date: '2026-05-11', numbers: [2, 8, 14, 22, 30, 49] },
          { id: '11', date: '2026-05-07', numbers: [6, 11, 19, 28, 36, 43] },
          { id: '12', date: '2026-05-04', numbers: [1, 7, 15, 24, 33, 40] },
          { id: '13', date: '2026-04-30', numbers: [3, 12, 20, 26, 34, 45] },
          { id: '14', date: '2026-04-27', numbers: [5, 10, 18, 29, 37, 42] },
          { id: '15', date: '2026-04-23', numbers: [8, 14, 21, 30, 39, 48] }
        ]
      }
    ]
  }
];
