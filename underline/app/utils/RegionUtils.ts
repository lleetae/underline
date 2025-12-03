export type RegionGroupKey =
    | 'metropolitan'
    | 'chungcheong'
    | 'gangwon'
    | 'gyeongbuk'
    | 'gyeongnam'
    | 'jeonbuk'
    | 'jeonnam'
    | 'jeju'
    | 'other';

export const REGION_GROUPS: Record<RegionGroupKey, { label: string; sidos: string[] }> = {
    metropolitan: {
        label: "서울/인천/경기",
        sidos: ["서울특별시", "인천광역시", "경기도"]
    },
    chungcheong: {
        label: "충청도",
        sidos: ["대전광역시", "충청북도", "충청남도", "세종특별자치시"]
    },
    gangwon: {
        label: "강원도",
        sidos: ["강원특별자치도"]
    },
    gyeongbuk: {
        label: "경북/대구",
        sidos: ["경상북도", "대구광역시"]
    },
    gyeongnam: {
        label: "부산/울산/경남",
        sidos: ["경상남도", "울산광역시", "부산광역시"]
    },
    jeonbuk: {
        label: "전북",
        sidos: ["전북특별자치도"]
    },
    jeonnam: {
        label: "전남/광주",
        sidos: ["전라남도", "광주광역시"]
    },
    jeju: {
        label: "제주",
        sidos: ["제주특별자치도"]
    },
    other: {
        label: "기타",
        sidos: []
    }
};

export function getRegionGroupKey(sido: string): RegionGroupKey {
    for (const [key, group] of Object.entries(REGION_GROUPS)) {
        if (group.sidos.includes(sido)) {
            return key as RegionGroupKey;
        }
    }
    return 'other';
}

export function getRegionDisplayName(groupKey: RegionGroupKey): string {
    return REGION_GROUPS[groupKey]?.label || "기타";
}

export function getSidosInGroup(groupKey: RegionGroupKey): string[] {
    return REGION_GROUPS[groupKey]?.sidos || [];
}

export function getSidosInSameGroup(sido: string): string[] {
    const key = getRegionGroupKey(sido);
    return getSidosInGroup(key);
}
