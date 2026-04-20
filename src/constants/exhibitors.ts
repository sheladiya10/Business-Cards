/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Exhibitor {
  name: string;
  hall: string;
  category?: string[]; // To be populated/searched
}

export const EXHIBITORS: Exhibitor[] = [
  // HALL 2
  ...[
    "A.G. Industries Pvt Ltd",
    "Abhijeet Tool & Dies Pvt Ltd",
    "Aishwarya Mould Tools Pvt Ltd",
    "Arya Trading Company",
    "Bharat Fritz Werner Ltd",
    "CAD CAM Galaxy",
    "Camozzi Automation Pvt Ltd",
    "Concord United Products Pvt Ltd",
    "Dolphin Laser Machine Pvt Ltd",
    "Electronica Machine Tools Ltd",
    "Forbes Precision Tools and Machine Parts Ltd",
    "Godrej & Boyce Mfg Co Ltd",
    "Hansard Industries Pvt Ltd",
    "Hi-Tech Printing Technologies",
    "HRS Flow India Pvt Ltd",
    "Indo German Vacu Treat Pvt Ltd",
    "INSIZE India",
    "J K Machines",
    "Krisna Mechatronics",
    "Laser Technologies Pvt Ltd",
    "Macro Technoplast Pvt Ltd",
    "Mazda Plastic Corporation",
    "MDX3D India LLP",
    "Metacut Technologies",
    "Motherson Techno Tools Ltd",
    "Nickunj Eximp Enterprises Ltd",
    "OPEN MIND Technologies India Pvt Ltd",
    "Orion Innotech Pvt Ltd",
    "Otto Bitt India Pvt Ltd",
    "PerfTech Services",
    "Pre Mould Engineers",
    "Protosys Technologies Pvt Ltd",
    "R & W Tools and Stamping Pvt Ltd",
    "Richcam Auto Engineers Pvt Ltd",
    "SLR Electronics LLP",
    "Sai Shantanu Enterprises",
    "Seven International",
    "Sigma Enterprises",
    "SKH Technologies",
    "SMW Autoblok",
    "Spark Mould Pvt Ltd",
    "Sterling Enterprise"
  ].map(name => ({ name, hall: "HALL 2" })),

  // HALL 3
  ...[
    "Protomet Technologies LLP",
    "Quaker Chemical India Pvt Ltd",
    "QVI India",
    "Radiant Chemicals Pvt Ltd",
    "Rainbow Technologies",
    "Ratnamani Capital Pvt Ltd",
    "Ratnapark Electronics Industries Ltd",
    "Rucha Engineers Pvt Ltd",
    "S & T Machinery Pvt Ltd",
    "Sahajanand Technologies Pvt Ltd",
    "Sai Engineering",
    "Schneider Form India Pvt Ltd",
    "Senco Metals Pvt Ltd",
    "Setco Spindles India Pvt Ltd",
    "Shakuntam Eximp",
    "Shree Rami Technologies",
    "Shreeji Marketing Corporation",
    "SISMA S.p.A",
    "Solix Logic Pvt Ltd",
    "Spheri India",
    "Star Laser Technology",
    "Store Supply India Agency",
    "Streamline Controls Pvt Ltd",
    "Succour Toolings",
    "Sumitra Die Works Pvt Ltd",
    "Sunita Engineering Corporation",
    "Sunrise Enterprises",
    "Synro Digital System Solutions Pvt Ltd",
    "Synventive Molding Solutions (JSW)",
    "Thrium Moulds & Dies Pvt Ltd",
    "Triumala Multi Technologies",
    "Tooling Technology",
    "Toolman Special Steels Pvt Ltd",
    "Tricut Precision Tools Pvt Ltd",
    "UCAM Pvt Ltd",
    "Valor Mech Pvt Ltd",
    "Veecor Corporation Ltd",
    "Ventura Alloys & Steels Pvt Ltd",
    "Venus Seimitsu LLP",
    "VJ Precision Molds Pvt Ltd",
    "Zerust India Pvt Ltd"
  ].map(name => ({ name, hall: "HALL 3" })),

  // HALL 6
  ...[
    "Accurate Sales & Services Pvt Ltd",
    "Ace Micromatic Group",
    "Alex Machine Tools",
    "Ashna Enterprise",
    "B.S. Steel Corporation",
    "Bhurji Navdeep Measuring & Testing Technology Pvt Ltd",
    "CIM Tools India Pvt Ltd",
    "Carl Zeiss India Pvt Ltd",
    "Dah-Hui Tools Corporation Pvt Ltd",
    "Die Steel International Pvt Ltd",
    "EST Tool Steel Pvt Ltd",
    "GGC Steel Company",
    "Hasc India Pvt Ltd",
    "Indotech Industries Pvt Ltd",
    "IITAC Automation Ltd",
    "JBM Auto Ltd",
    "Jyoti CNC Automation Ltd",
    "Kunal Metal & Steel Industries Pvt Ltd",
    "Lokesh Machines Ltd",
    "LMW Ltd",
    "Macpower CNC Machines Pvt Ltd",
    "Micromatic Grinding Technologies Ltd",
    "Mirrormatic Machines LLP",
    "MMC Hardmetal India Pvt Ltd",
    "Meusburger India Pvt Ltd",
    "Moldtech Engineers",
    "Mukand Ltd",
    "Plasmatech Engineers Pvt Ltd",
    "Pragati Ispat Pvt Ltd",
    "Prime Graphite Pvt Ltd",
    "Regofix India Pvt Ltd",
    "S&T Engineers Pvt Ltd",
    "Sridevi Tools Pvt Ltd",
    "Yamato Kikai India Pvt Ltd",
    "Zoller India Pvt Ltd"
  ].map(name => ({ name, hall: "HALL 6" })),

  // ASSOCIATIONS
  ...[
    "AIPMA",
    "AMAPLAST",
    "IGSPA",
    "IMTMA",
    "UCIMU-SISTEMI PER PRODURRE"
  ].map(name => ({ name, hall: "Associations / Pavilion" })),

  // JAPAN PAVILION
  ...[
    "FUSO Mold & Manufacturing Co., Ltd",
    "Futaba Corporation",
    "Hirakawa Industry",
    "Japan Die & Mold Industry Association (JDMIA)",
    "Japan India Business Bureau",
    "Nikkei Kogyo",
    "Okaji Seiko Co., Ltd",
    "Sankyo Seisakusho",
    "Shipo Moulds Co Ltd",
    "Tabie Seisakusho"
  ].map(name => ({ name, hall: "Japan Pavilion" }))
];
