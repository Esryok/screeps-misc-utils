// Gets a room name from its corresponding numeric form
function rawToRoom(raw) {
    if (raw === 0xffff)
        return "sim";
    return (((raw & 0x8000) ? "W" : "E") + ((raw >> 8) & 0x7f)) +
           (((raw & 0x80) ? "N" : "S") + (raw & 0x7f));
}

// Gets the numeric representation of a room name
function roomToRaw(roomName) {
    if (roomName === "sim")
        return 0xffff;
    let roomTokens = /^([WE])([0-9]+)([NS])([0-9]+)$/.exec(roomName);
    return ((roomTokens[2] | (roomTokens[1] === 'W' ? 0x80 : 0)) & 0xff) << 8 |
           ((roomTokens[4] | (roomTokens[3] === 'N' ? 0x80 : 0)) & 0xff);
}

// Serializes an array of RoomPositions into string form
function serializePath(path) {
    let roomToIndex = {};
    let roomRaws = "";
    let posRaws = String.fromCharCode(path.length);
    for (let index in path) {
        let pos = path[index];
        let roomIndex = roomToIndex[pos.roomName];
        if (roomIndex === undefined) {
            roomToIndex[pos.roomName] = roomRaws.length;
            roomRaws += String.fromCharCode(roomToRaw(pos.roomName));
            roomIndex = roomToIndex[pos.roomName];
        }
        if (roomIndex >= 16)
            throw ("Failed to serialize path, exceeded max room count 16: " + JSON.stringify(path));
        let posRaw = (roomIndex << 12) | (pos.x << 6) | (pos.y);
        posRaws += String.fromCharCode(posRaw);
    }
    return String.fromCharCode(roomRaws.length) + roomRaws + posRaws;
}

// Converts serialized path into an array of RoomPositions
function deserializePath(rawPath) {
    let roomLength = rawPath.charCodeAt(0);
    let rooms = [];
    for (let i = 0; i < roomLength; i++) {
        rooms.push(rawToRoom(rawPath.charCodeAt(1 + i)));
    }
    let path = [];
    let pathLength = rawPath.charCodeAt(1 + roomLength);
    for (let i = 0; i < pathLength; i++) {
        let rawPos = rawPath.charCodeAt(2 + roomLength + i);
        let roomIndex = rawPos >> 12;
        let roomName = rooms[roomIndex];
        let x = (rawPos >> 6) & 63;
        let y = (rawPos) & 63;
        path.push(new RoomPosition(x, y, roomName));
    }
    return path;
}

// Gets the number of positions in a path
function getPathLength(rawPath) {
    let roomLength = rawPath.charCodeAt(0);
    return rawPath.charCodeAt(1 + roomLength);
}

// Gets the position at the given index
function getPosFromPath(rawPath, index) {
    let roomLength = rawPath.charCodeAt(0);
    if (2 + roomLength + index < rawPath.length) {
        let rawPos = rawPath.charCodeAt(2 + roomLength + index);
        let roomIndex = rawPos >> 12;
        let roomName = rawToRoom(rawPath.charCodeAt(1 + roomIndex));
        let x = (rawPos >> 6) & 63;
        let y = (rawPos) & 63;
        return new RoomPosition(x, y, roomName);
    }
}