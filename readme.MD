# Wittgenstein BOT 🤖 (Obsolete READ.ME, Heroku branch works differently)

This repository contains the code for the Wittgenstein AI BOT and all you need in order to run it by yourself! It uses PM2 for process management and loads environment variables from a `.env` file.

## Requirements

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [PM2](https://pm2.keymetrics.io/) (for process management)

# Setup steps ( very fast-forward! ) 🚀

### 1. **Clone the Repository and Install Dependencies**

   To get started, first clone the repository and install the necessary dependencies. Run the following commands:

   ```bash
   git clone https://github.com/your_username/wittgenstein-bot.git
   cd wittgenstein-bot
   npm install

### Configure Environment Variables

Create a `.env` file from the sample provided and populate it with your API keys:


cp .env.sample .env
sudo nano .env
#Save changes with ctrl+o and return (enter)

### Then, we need to build our /dist directory because of the project is made in TypeScript:

npm run build
```
#### API_KEY=your_discord_api_key_here
#### OPENAI_API_KEY=your_openai_api_key_here
#### GEMINIAI_API_KEY=your_gemini_ai_key_here

Then, just save the file and run it by using PM2
or nohup!


### 2. Running with PM2 🛠️

Use PM2 to start the application using the ecosystem configuration file located in the config directory:

- Install [PM2](https://pm2.keymetrics.io/) in your server/system



Then, in the root of you recently created build directory, just start the pm2 instance by using:

``` bash
pm2 start config/ecosystem.config.js
```
If you need to restart or close the PM2 instance, just follow the commands on the official PM2 website
[PM2](https://pm2.keymetrics.io/). 

Nevertheless, the basic commands are as follow:
- pm2 list
- pm2 status
- pm2 stop
- pm2 restart
- pm2 delete
- pm2 kill

### 2.1 If you want to, you can use nohup instead:
If you leading to use nohup in your Linux system, then you can just run the bot by using the following command in the repository directory:

```bash
nohup node index.js > output.log 2>&1 &
```

Again, if you need to close the background process, you will need to check current NodeJS running process:

```bash
ps aux | grep node
```

Then, check the second column, the PID numeric value, and kill the process:

```bash
kill -9 PID
```


# That's it, your bot is ready to go! 🚀 


## TO-DO
- ProcessAnyMessage must be more generic to logging through winston dependency.

- Assignations for config statements like:
- - Max number of queries per user
- - Max number of queries per day
- - Admin/premium users list
- - More...

#