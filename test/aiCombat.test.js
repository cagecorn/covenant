import { expect } from 'chai';
import { Unit } from '../js/unit.js';
import { UNIT_TEMPLATES } from '../js/data.js';
import { AiManager, MetaAiManager } from '../js/managers/index.js';

const createManagers = () => {
    const meta = new MetaAiManager();
    const ai = new AiManager(meta);
    return {
        logManager: { add() {}, flush() {}, clear() {} },
        eventManager: { publish() {}, subscribe() {} },
        vfxManager: { addPopup() {}, draw() {}, drawStatusIcons() {} },
        statusEffectManager: { register() {}, remove() {}, updateTurn() {} },
        battleMaster: {},
        aiManager: ai,
        metaAiManager: meta
    };
};

describe('AI combat integration', () => {
    it('unit attacks an enemy when in range', () => {
        const managers = createManagers();
        const attacker = new Unit(UNIT_TEMPLATES.p_warrior, 'player', 0, 0, managers);
        const defender = new Unit(UNIT_TEMPLATES.e_warrior, 'enemy', 2, 0, managers);
        const initialShield = defender.shield;
        attacker.takeTurn([defender], [attacker]);
        expect(defender.shield).to.be.below(initialShield);
    });
});
