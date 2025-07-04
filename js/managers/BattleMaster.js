export const battleMaster = {
    prepareBattle: (units, context, logManager) => {
        logManager.add(`--- [${context.terrain}] 지형, [${context.weather}] 날씨에서 전투 시작! ---`);
        units.forEach(unit => {
            if (context.terrain === '숲' && unit.classType === 'Archer') {
                unit.contextualBonus.attack += 5;
                logManager.add(`🏹 숲 지형 효과로 ${unit.name}의 공격력이 5 증가합니다.`);
            }
            if (context.weather === '비' && unit.elementalType === 'fire') {
                unit.contextualBonus.attack -= 5;
                logManager.add(`💧 비 날씨 효과로 화염 속성 ${unit.name}의 공격력이 5 감소합니다.`);
            }
        });
    }
};
