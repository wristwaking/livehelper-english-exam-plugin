const ipcRenderer = require("electron").ipcRenderer;
const { execSync } = require('child_process');
const path = require('path')
const axios = require('axios')

const fs = require("fs")
let dir = process.cwd();
const crypto = require('crypto');

new Vue({
    el: '#app',
    data: {
        liveHelperState: false,
        state: true,
        problem: {},
        messageList: [],
        wordList: [],
        userList: [],
        state: false,
        index: 0,
        eventLock: false,
        eventListener: null,
        liveHelperListener: null,
        trace: {}
    },
    methods: {
        closeApp() {
            ipcRenderer.send("close-app")
        },
        miniApp() {
            ipcRenderer.send("resize-app")
        },
        checkLiveHelperState() {
            if (this.liveHelperListener) {
                clearInterval(this.liveHelperListener)
            }
            this.liveHelperListener = setInterval(() => {
                axios.get("http://localhost:7902/Api/userhash").then(res => {
                    if (res.data.code == 0) {
                        this.liveHelperState = true
                    }
                }).catch(err => {
                    this.liveHelperState = false
                })
            }, 1000)
        },
        startGame() {
            axios.get("https://word.willwaking.com/server/api/word/1000").then(res => {
                this.wordList = res.data
                this.initEnglishProblem()
                this.state = true
                this.startHelper()
            })
        },
        listenEnglishVoice() {
            this.$refs.english.play()
        },
        isEnglish(content) {
            const regex = /^[A-Za-z]+$/;
            return regex.test(content);
        },
        startHelper() {
            if (this.eventListener) {
                clearInterval(this.eventListener)
            }
            this.eventListener = setInterval(() => {
                if (this.eventLock) { return }
                this.eventLock = true
                axios.get("http://localhost:7902/Api/events").then(res => {
                    res.data.forEach(event => {
                        if (event.type == 'comment') {
                            if (this.isEnglish(event.content)) {
                                if (event.content.length <= 20) {
                                    if (this.problem.english == event.content) {
                                        this.addInitMessage(event.user, event.content, true)
                                        if (!this.checkUserExisted(event.user.user_id)) {
                                            this.addInitUser(event.user)
                                        }
                                        this.addUserPointNumber(event.user.user_id)
                                        this.initEnglishProblem()
                                    } else {
                                        this.addInitMessage(event.user, event.content, false)
                                    }
                                }
                            }
                        }
                    })
                    this.userList.sort((a, b) => b.point - a.point);
                    this.eventLock = false
                }).catch(err => {
                    this.state = false
                    this.liveHelperState = false
                })
            }, 1000)
        },
        openTaobao() {
            execSync('start chrome https://edgehacker.taobao.com')
        },
        openLivehelperWeb() {
            execSync('start chrome https://livehelper.willwaking.com')
        },
        openWakeLanguage() {
            execSync('start chrome https://word.willwaking.com')
        },
        generateRandomString(length) {
            return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
        },
        checkUserExisted(user_id) {
            let flag = false
            this.userList.forEach(user => {
                if (user.user_id == user_id) {
                    flag = true
                }
            });
            return flag
        },
        addInitUser(user) {
            this.userList.push({
                user_id: user.user_id,
                nick: user.nick,
                avatar: user.avatar ? user.avatar : "https://i0.hdslb.com/bfs/face/member/noface.jpg",
                point: 0
            })
        },
        scrollBottom() {
            const chatContainer = document.getElementById('history-scroll');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        },
        addInitMessageTemplate() {
            this.messageList.push({
                id: this.generateRandomString(8),
                user_id: this.generateRandomString(8),
                nick: "边缘骇客",
                content: "edgehacker",
                result: true
            })
            this.scrollBottom()
        },
        addInitMessage(user, content, result) {
            this.messageList.push({
                id: this.generateRandomString(8),
                user_id: user.user_id,
                nick: user.nick,
                content: content,
                result: result
            })
            this.scrollBottom()
        },
        addUserPointNumber(user_id) {
            this.userList.forEach((user, index) => {
                if (user.user_id == user_id) {
                    this.userList[index].point += 10
                }
            });
        },
        initEnglishProblem() {
            if (this.problem) { this.trace = this.problem }
            this.index = this.index + 1
            let index = Math.floor(Math.random() * this.wordList.length);
            this.problem = this.wordList[index];
        },
        showChineseFormat(chinese) {
            if (!chinese) return "";
            let result = "";
            for (let index = 0; index < chinese.length; index++) {
                result = result + Object.keys(chinese[index])[0] + " ";
                result = result + chinese[index][Object.keys(chinese[index])[0]] + " ";
            }
            return result;
        },
    },
    mounted() {
        this.checkLiveHelperState()
    },
    beforeDestory() {
        if (this.liveHelperListener) {
            clearInterval(this.liveHelperListener)
        }
        if (this.eventListener) {
            clearInterval(this.eventListener)
        }
    }
})