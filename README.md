# Mahjong

Play Mahjong in your browser with your friends.

Please note this is the real Mahjong game, not the weird tile matching one. We don't play that one.

## Usage

```bash
# Compile the client
cd client
npm install
npm run build

# Then run the server
cd server
npm install
npm start
```

You can now visit `localhost:1234` in your browser to play. Enter your name, and then enter a game name. All
players (up to 4) who enter the same game name will join that game. Once the first player presses "Start", the
game will begin.

## Configuration

The port (`mahjong_port`) and save data directory (`mahjong_state`) can be changed by modifying the 
values in `server/.env`. Changing the `mahjong_dist` directory is not recommended.
