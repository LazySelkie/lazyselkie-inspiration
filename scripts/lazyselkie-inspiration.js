class SelkieInspiration {
    static ID = "lazyselkie-inspiration";
    static ID_CAPS = "SELKIE-INSPIRATION";
    static FLAGS = {
        INSPIRATION: "lazyselkie-inspiration"
    };
    static SETTINGS = {
        DEBUG: 'debug',
        MAX_INSPIRATION: 'max-selkie-inspiration',
        INSPIRATION_COLOR: 'inspiration-color'
    }

    // Для применения этого лога вместо console.log(args) писать SelkieInspiration.log(false, args)
    static log(force, ...args) {
        const shouldLog = force || game.settings.get(this.ID, this.SETTINGS.DEBUG);

        if (shouldLog) {
            console.log(this.ID, "|", ...args);
        }
    }

    static initialize() {

        // Register settings
        // DEBUG: 'debug'
        game.settings.register(this.ID, this.SETTINGS.DEBUG, {
            name: `${this.ID_CAPS}.settings.${this.SETTINGS.DEBUG}.Name`,
            default: false,
            type: Boolean,
            scope: 'client',
            config: true,
            //hint: `${this.ID_CAPS}.settings.${this.SETTINGS.DEBUG}.Hint`,
        });
        // MAX_INSPIRATION: 'max-selkie-inspiration'
        game.settings.register(this.ID, this.SETTINGS.MAX_INSPIRATION, {
            name: `${this.ID_CAPS}.settings.${this.SETTINGS.MAX_INSPIRATION}.Name`,
            default: 3,
            type: Number,
            scope: 'world',
            config: true,
            //hint: `${this.ID_CAPS}.settings.${this.SETTINGS.MAX_INSPIRATION}.Hint`,
        });
        // INSPIRATION_COLOR: 'inspiration-color'
        game.settings.register(this.ID, this.SETTINGS.INSPIRATION_COLOR, {
            name: `${this.ID_CAPS}.settings.${this.SETTINGS.INSPIRATION_COLOR}.Name`,
            hint: `${this.ID_CAPS}.settings.${this.SETTINGS.INSPIRATION_COLOR}.Hint`,
            default: "#2b1692",
            type: String,
            scope: 'client',
            config: true,
        });
    }
}

class SelkieInspirationData {

    /**
     * 
     * @param {string} actorId 
     * @param {number} number - amount of inspirations to give; default: 1
     */
    static giveInspirationToActor(actorId, number = 1) {
        const actor = game.actors.get(actorId);
        const inspirations = this.getActorInspiration(actorId);
        const maxInspirations = game.settings.get(SelkieInspiration.ID, SelkieInspiration.SETTINGS.MAX_INSPIRATION);
        if (inspirations < maxInspirations) {
            if (inspirations == 0) {
                actor.update({"system.attributes.inspiration": true});
            }
            actor.setFlag(SelkieInspiration.ID, SelkieInspiration.FLAGS.INSPIRATION, Math.min(inspirations + number, maxInspirations));
        }
    }
    /**
     * 
     * @param {string} actorId 
     * @param {number} number - amount of inspirations to remove; default: 1
     */
    static removeInspirationFromActor(actorId, number = 1) {
        const actor = game.actors.get(actorId);
        const inspirations = this.getActorInspiration(actorId);
        actor.setFlag(SelkieInspiration.ID, SelkieInspiration.FLAGS.INSPIRATION, Math.max(0, inspirations - number));
        if (inspirations - number <= 0) {
            actor.update({"system.attributes.inspiration": false});
        }
    }
    /**
     * 
     * @param {Array} actorIds - array of actor Швы to whom give inspiration
     * @param {number} number - amount of inspirations to give; default: 1
     */
    static giveInspirationToActors(actorIds, number = 1) {
        actorIds.forEach((actorId) => {
            this.giveInspirationToActor(actorId, number);
        })
    }
    static getActorInspiration(actorId) {
        return Number(game.actors.get(actorId).getFlag(SelkieInspiration.ID, SelkieInspiration.FLAGS.INSPIRATION)) || 0;
    }
    // Нереализованная функция, теоретически должна из списка юзеров получать список персонажей игроков (т.к.там есть присвоение), и вот им выдавать Вдохновение
    //static giveInspirationToPCs() {} // Array.from(game.users)[1].character
}

Hooks.once("init", async function () {  
    // CONFIG.debug.hooks = true;
    // Нужная строчка, чтобы иметь доступ к SelkieInspirationData из консоли
    window.SelkieInspirationData = SelkieInspirationData;

    SelkieInspiration.initialize();
    SelkieInspiration.log(false, "LazySelkie's Inspiration Initialization finished")
    
});

Hooks.on("renderActorSheet5eCharacter", async function (actorSheet, html) {
    SelkieInspiration.log(false, "renderSheet hook, ", actorSheet, html);
    const inspirationDiv = await html.find(`.inspiration`);
    const inputDiv = inspirationDiv.find(`input`);
    inputDiv.prop('disabled', true);
    const labelDiv = inspirationDiv.find(`label`);
    labelDiv.addClass("fa-stack");

    const inspirations = actorSheet.actor.getFlag(SelkieInspiration.ID, SelkieInspiration.FLAGS.INSPIRATION);
    const inspirationColor = game.settings.get(SelkieInspiration.ID, SelkieInspiration.SETTINGS.INSPIRATION_COLOR);
    labelDiv.append(
        `<i class='selkie-inspiration-button fas fa-stack-1x fa-${inspirations || 0}' style="color: ${inspirationColor}"></i>`
    );
});

// Добавляем прямоугольник-пипетку к настройке цвета Вдохновения, чтоб удобнее было
Hooks.on("renderSettingsConfig", (app, html, data) => {
    let color = game.settings.get(SelkieInspiration.ID, SelkieInspiration.SETTINGS.INSPIRATION_COLOR);
    $('<input>').attr('type', 'color').attr('data-edit', `${SelkieInspiration.ID}.${SelkieInspiration.SETTINGS.INSPIRATION_COLOR}`).val(color).insertAfter($(`input[name="${SelkieInspiration.ID}.${SelkieInspiration.SETTINGS.INSPIRATION_COLOR}"]`, html).addClass('color'));
});

// Разные хуки, вызываемые при открытии листа персонажа
// renderTidy5eSheet, renderActorSheet5eCharacter, renderActorSheet5e, renderActorSheet  