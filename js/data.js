// [데이터 파일]
// 이 파일은 게임의 모든 정적 데이터(템플릿, 설정값 등)를 보관합니다.

// 파일 경로: js/data.js


export const UNIT_TEMPLATES = {
    p_warrior: { name: '전사', classType: 'Warrior', ai: 'aggressive', hp: 120, attackPower: 20, valor: 20, weight: 50, skills: ['powerStrike', 'stoneSkin'] },
    p_knight:  { name: '기사', classType: 'Warrior', ai: 'aggressive', hp: 150, attackPower: 18, valor: 30, weight: 65, skills: ['stoneSkin'] },
    p_cavalry: { name: '기마병', classType: 'Cavalry', ai: 'assassin', hp: 100, attackPower: 22, valor: 15, weight: 40, skills:['powerStrike', 'vampiricTouch'] },
    p_archer:  { name: '궁수', classType: 'Archer',  ai: 'kiting', hp: 70, attackPower: 25, valor: 5, weight: 30, skills: ['paralyzingShot'] },
    p_healer:  { name: '사제', classType: 'Healer',  ai: 'support', hp: 80, attackPower: 10, valor: 10, weight: 25, skills: ['heal', 'cleanse'] },
    p_mage:    { name: '마법사', classType: 'Mage', ai: 'kiting', hp: 60, attackPower: 30, valor: 10, weight: 35, skills: ['poisonSting'] },
    
    e_warrior: { name: '오크 전사', classType: 'Warrior', ai: 'aggressive', hp: 120, attackPower: 20, valor: 20, weight: 55, skills: ['powerStrike'] },
    e_troll:   { name: '트롤', classType: 'Warrior', ai: 'aggressive', hp: 160, attackPower: 18, valor: 10, weight: 80, skills: ['stoneSkin'] },
    e_cavalry: { name: '와르그', classType: 'Cavalry', ai: 'assassin', hp: 100, attackPower: 22, valor: 15, weight: 45, skills: ['vampiricTouch'] },
    e_archer:  { name: '고블린 궁수', classType: 'Archer', ai: 'kiting', hp: 70, attackPower: 25, valor: 5, weight: 32, skills: ['paralyzingShot'] },
    e_shaman:  { name: '오크 주술사', classType: 'Healer', ai: 'support', hp: 80, attackPower: 10, valor: 10, weight: 28, skills: ['heal', 'cleanse'] },
    e_mage:    { name: '고블린 마법사', classType: 'Mage', ai: 'kiting', hp: 60, attackPower: 30, valor: 10, weight: 38, skills: ['confuseRay', 'poisonSting'] },
};


export const CLASS_STATS = {
    Warrior:  { range: 1, moveSpeed: 3, icon: '⚔️' },
    Cavalry:  { range: 2, moveSpeed: 5, icon: '🐎' },
    Archer:   { range: 4, moveSpeed: 3, icon: '🏹' },
    Mage:     { range: 3, moveSpeed: 2, icon: '🔮' },
    Healer:   { range: 3, moveSpeed: 3, icon: '💖' }
};
