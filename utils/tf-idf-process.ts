const natural = require('natural');
const cosineSimilarity = require('compute-cosine-similarity');
const { PorterStemmer } = natural;
const { TfIdf } = natural;
// const {  } = require('@types/natural')

enum ValidCommands {
    LOGS_SHOW = "logs",
    LOGS_ENABLE = "logs enable",
    LOGS_DISABLE = "logs disable",
    MAN_HELP = "sudo man",
    QUERY_LLM = "query",
}

type TfIdfTerm = {
    term: string;
    tfidf: number;
};

const possibleCommands = Object.values(ValidCommands);

const getTheMaxArray = (array: number[]) : [boolean,string] => {

    const maxValue = Math.max.apply(null, array);
    const maxIndex = array.indexOf(maxValue);

    if (maxValue < 0.02) {
        return [false, ''];
    }

    return [true, possibleCommands[maxIndex]];

}

const normalizeText = (text:string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .map(word => PorterStemmer.stem(word))
        .join(' ');
};


// List of commands
const commandsInfo = {
    "mostrar, ver,  muestra, mostró, mostrando, muéstrame, mostrémosle, mostraba, mostraron,\
     mostraba, mostraré, mostraría, mostrando, mostrados, show, shows, showed, showing, show up, shows up,\
      showed up, showing up, mostrarm, muestrame, muestra, muestra , mostrar, estado, status , currently, \
      tell me, saber, know, see": "!logs",

    "open, activa , abre , abrir, activa,activa ,abre, abierto, abiertos, abreme, enable, enables, enabled, enabling, activate, activates, activated, activating,\
    on, start, starts, started, starting, initiate, initiates, initiated, initiating, set up, sets up,\
    set up, setting up, engage, engages, engaged, engaging, power up, powers up, powered up, powering up,\
    permit, permits, permitted, permitting, authorize, authorizes, authorized, authorizing, allow,\
    allows, allowed, allowing, make active, makes active, made active, making active, trigger, triggers,\
    triggered, triggering, enlist, enlists, enlisted, enlisting,\
    habilitar, habilita, habilitó, habilitando, habilitamos, habilitaré, habilitaría, habilitados, habilitada, habilitadas, habilitaría,\
    activar, activó, activando, activamos, activaré, activaría, activados, activada, activadas, activaríamos,\
    encender, enciende, encendió, encendiendo, encendemos, encenderé, encendería, encendidos, encendida, encendidas,\
    iniciar, inicia, inició, iniciando, iniciamos, iniciaré, iniciaría, iniciados, iniciada, iniciadas, iniciaría,\
    poner en marcha, pone en marcha, puso en marcha, poniendo en marcha, ponemos en marcha, pondremos en marcha,\
    pondría en marcha, puestos en marcha, puesta en marcha, puestas en marcha, poner en funcionamiento, pone en funcionamiento,\
    puso en funcionamiento, poniendo en funcionamiento, ponemos en funcionamiento, pondremos en funcionamiento,\
    pondría en funcionamiento, puestos en funcionamiento, puesta en funcionamiento, puestas en funcionamiento": "!logs enable",
    
    "deshabilitar, cierra, parar ,parar, deshabilita, deshabilitó, deshabilitando, deshabilitamos, deshabilitaré, \
    deshabilitaría, deshabilitados,\
    deshabilitada, deshabilitadas, deshabilitaría, desactivar, desactiva, desactivó, desactivando, desactivamos,\
    desactivaré, desactivaría, desactivados, desactivada, desactivadas, desactivaríamos, apagar, apaga, apagó,\
    apagando, apagamos, apagaré, apagaría, apagados, apagada, apagadas, parar, para, paró, parando, paramos,\
    pararé, pararía, parados, parada, paradas, cortar, corta, cortó, cortando, cortamos, cortaré, cortaría,\
    cortados, cortada, cortadas, interrumpir, interrumpe, interrumpió, interrumpiendo, interrumpimos, interrumpiré,\
    interrumpiría, interrumpidos, interrumpida, interrumpidas, finalizar, finaliza, finalizó, finalizando,\
    finalizamos, finalizaré, finalizaría, finalizados, finalizada, finalizadas, cancelar, cancela, canceló,\
    cancelando, cancelamos, cancelaré, cancelaría, cancelados, cancelada, canceladas, bloquear, bloquea, bloqueó,\
    bloqueando, bloqueamos, bloquearé, bloquearía, bloqueados, bloqueada, bloqueadas, prevenir, previene, previno,\
    previniendo, prevenimos, preveniré, preveniría, prevenidos, prevenida, prevenidas, inhibir, inhibe,\
    inhibió, inhibiendo, inhibimos, inhibiré, inhibiría, inhibidos, inhibida, inhibidas, restringir, restringe,\
    restringió, restringiendo, restringimos, restringiré, restringiría, restringidos, restringida, restringidas,\
    cesar, cesa, cesó, cesando, cesamos, cesaré, cesaría, cesados, cesada, cesadas, inactivar inactiva, inhabilita, inhabilitar,\
    disable, disables, disabled, disabling, deactivate, deactivates, deactivated, deactivating,\
     off\
    stop, stops, stopped, stopping, halt, halts, halted, halting, end, ends, ended, ending, cut off,\
    cuts off, cut off, cutting off, withdraw, withdraws, withdrew, withdrawing, cancel, cancels, canceled,\
    canceling, block, blocks, blocked, blocking, prevent, prevents, prevented, preventing, inhibit,\
    inhibits, inhibited, inhibiting, restrain, restrains, restrained, restraining, cease, ceases,\
    ceased, ceasing": "!logs disable",
};

// const commandsInfo = Object.assign({}, commandsInfoEnglish, commandsInfoSpanish);




const commands = Object.keys(commandsInfo);

const logPattern = /log[a-zA-Z]{0,2}/i;

const checkCommandType = (inputMessage: string) => {

    if (logPattern.test(inputMessage)) {
        return 'logs';
    }

    return inputMessage;

}

// Create the TF-IDF model
const tfidf = new natural.TfIdf();
commands.forEach(command => tfidf.addDocument(normalizeText(command)));

const processTheInput = (inputMessage: string): string => {

    const normalizedInput = normalizeText(inputMessage);

    const commandType = checkCommandType(inputMessage)

    const isValidCommandType = Object.values<string>(ValidCommands).includes(commandType as ValidCommands);
    
    if (!isValidCommandType) {
        return inputMessage;
    }
    
    const commands:Array<string> = Object.keys(commandsInfo);

    // const normalizedInput = inputMessage

    // Vectorize the input command with the same TF-IDF
    const inputTfidf: InstanceType<typeof natural.TfIdf> = new natural.TfIdf();
    inputTfidf.addDocument(normalizedInput);

    // Create a set of unique terms in the commands and the input
    const allTerms: Set<string> = new Set();

    commands.forEach((_, index) => {
        tfidf.listTerms(index)
        // .forEach(term  => allTerms.add(term.term));
        .forEach((term: { term: string; tfidf: number }) => allTerms.add(term.term));
    });

    inputTfidf.listTerms(0)
    .forEach((term: TfIdfTerm) => allTerms.add(term.term));

    // Create vectors for the commands and the input based on the unique terms
    const commandVectors = commands.map((_, index) => {

        return Array.from(allTerms).map(term => {

            const terms = tfidf.listTerms(index) as TfIdfTerm[];
            const foundTerm = terms.find(t => t.term === term);

            return foundTerm ? foundTerm.tfidf : 0;
        });
    });

    const inputVector = Array.from(allTerms).map(term => {
        const foundTerm: TfIdfTerm | undefined = inputTfidf.listTerms(0)
        .find((t: TfIdfTerm) => t.term === term);
        return foundTerm ? foundTerm.tfidf : 0;
    });
    

    // Calculate the cosine similarity between the input and the commands
    const cosineSimilarities = commandVectors.map(vector => cosineSimilarity(inputVector, vector));

    const response = getTheMaxArray(cosineSimilarities)

    if (response[0]) {
        return `${response[1]}`;
    }

    return `${inputMessage}`;
};

module.exports = {
    processTheInput,
    possibleCommands,
};
