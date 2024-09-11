# Wittgenstein BOT 🤖

This repository contains the code for the Wittgenstein AI BOT and all you need in order to run it by yourself! It uses PM2 for process management and loads environment variables from a `.env` file.

## Requirements

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [PM2](https://pm2.keymetrics.io/) (for process management)

# Setup steps ( very fastforward! ) 🚀

### 1. **Clone the Repository and Install Dependencies**

   To get started, first clone the repository and install the necessary dependencies. Run the following commands:

   ```bash
   git clone https://github.com/your_username/wittgenstein-bot.git
   cd wittgenstein-bot
   npm install

### Configure Environment Variables

Create a `.env` file from the sample provided and populate it with your API keys:

```bash
cp .env.sample .env
sudo nano .env
```
#### API_KEY=your_api_key_here
#### OPENAI_API_KEY=your_openai_api_key_here
#### GEMINIAI_API_KEY=your_gemini_ai_key_here

Then, just save the file and run it by using PM2
or nohup!


### 2. Running with PM2 🛠️
Start the Application
Use PM2 to start the application using the ecosystem configuration file located in the config directory:

In the root repository folder, just start the pm2 instance by using:

``` bash
pm2 start config/ecosystem.config.js
```

# That's it, your bot is ready to go! 🚀 