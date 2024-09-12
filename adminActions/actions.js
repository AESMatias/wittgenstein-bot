const enableLogs = async (message, username) => {

    if (!(message instanceof Message)){
        console.error('Message is not an instance of Message class');
        return;
    }

    const channelId = message.channel.id;
    const channelName = message.channel.name;
    const channelType = message.channel.type;
    const messageContent = message.content;
    const messageAuthor = message.author.username;
    const messageAuthorId = message.author.id;
    const isBot = message.author.bot;
    const messageTimestamp = message.createdTimestamp;
    const messageAuthorNickname = message.member.nickname;

    const todayTimestamp = new Date();
    const todayDate = todayTimestamp.getDate();
    const todayMonth = todayTimestamp.getMonth();
    const todayDateAndMonth = `${todayDate}-${todayMonth}`;
    const todayFullDate = `${todayDate}-${todayMonth}-${todayTimestamp.getFullYear()}`;
    const todayTime = todayTimestamp.toLocaleTimeString();
    const fileTitle = `-- Messages from ${messageAuthor} (id: ${message.author.id}) on ${todayFullDate}:`;
    
    if (message instanceof Message) {
        // const logPath = path.join(__dirname, '.', 'logs', 'usersMessages', `${messageAuthor}`, `${messageAuthor}_${todayFullDate}.log`);
        // const logMessage = `(${todayTime}) => ${message.author.username}: ${message.content}`;

        try {
            const filePath = await findLogFile(username, todayFullDate);
            return filePath; // Devuelve la ruta del archivo de log encontrado
          } catch (err) {
            console.error('Error finding log file:', err.message);
            return null;
          }

    }
};

module.exports = enableLogs;