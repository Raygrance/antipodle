// The 21 standard HS "sections", keyed by 2-digit HS chapter ranges. Used by the BACI
// converter so boxes are readable categories ("Machinery & electrical") instead of
// 97 separate chapters.

const SECTIONS = [
  [1, 5, "Animal products"],
  [6, 14, "Vegetable products"],
  [15, 15, "Fats & oils"],
  [16, 24, "Food, drink & tobacco"],
  [25, 27, "Minerals & fuels"],
  [28, 38, "Chemicals"],
  [39, 40, "Plastics & rubber"],
  [41, 43, "Hides & leather"],
  [44, 46, "Wood"],
  [47, 49, "Paper"],
  [50, 63, "Textiles & apparel"],
  [64, 67, "Footwear & headwear"],
  [68, 70, "Stone, ceramic & glass"],
  [71, 71, "Precious stones & metals"],
  [72, 83, "Base metals"],
  [84, 85, "Machinery & electrical"],
  [86, 89, "Vehicles & transport"],
  [90, 92, "Instruments & clocks"],
  [93, 93, "Arms"],
  [94, 96, "Misc. manufactured"],
  [97, 99, "Art & antiques"],
];

export function sectionForHs2(chapter) {
  const n = Number(chapter);
  const hit = SECTIONS.find(([lo, hi]) => n >= lo && n <= hi);
  return hit ? hit[2] : "Other";
}
