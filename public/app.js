class VoiceAssistant {
    constructor() {
        this.retellClient = new RetellWebClient();
        this.isCallActive = false;
        this.currentAgent = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.retellClient.on("call_started", () => {
            console.log("📞 Call started");
            this.isCallActive = true;
            this.updateStatus("✅ Connected! Start speaking...");
            this.showCallControls(true);
        });

        this.retellClient.on("call_ended", () => {
            console.log("📞 Call ended");
            this.isCallActive = false;
            this.currentAgent = null;
            this.updateStatus("📞 Call ended. Choose an agent to start again.");
            this.showCallControls(false);
            this.resetButtons();
        });

        this.retellClient.on("agent_start_talking", () => {
            this.updateStatus("🗣️ AI is speaking...");
        });

        this.retellClient.on("agent_stop_talking", () => {
            this.updateStatus("👂 Listening...");
        });

        this.retellClient.on("update", (update) => {
            if (update.transcript) {
                this.updateTranscript(update.transcript);
            }
        });

        this.retellClient.on("error", (error) => {
            console.error("❌ Call error:", error);
            this.updateStatus("❌ Connection error. Please try again.");
            this.endCall();
        });
    }

    async startCall(agentType) {
        if (this.isCallActive) {
            this.endCall();
            return;
        }

        try {
            this.currentAgent = agentType;
            this.updateStatus("🔄 Connecting...");
            this.setButtonActive(agentType, true);

            const response = await fetch('/api/create-web-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agent_type: agentType,
                    user_id: this.generateUserId(),
                    metadata: {
                        page_url: window.location.href,
                        user_agent: navigator.userAgent
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const { access_token } = await response.json();

            await this.retellClient.startCall({
                accessToken: access_token,
                sampleRate: 24000,
                emitRawAudioSamples: false
            });

        } catch (error) {
            console.error("Failed to start call:", error);
            this.updateStatus("❌ Failed to connect. Please try again.");
            this.resetButtons();
        }
    }

    endCall() {
        if (this.isCallActive) {
            this.retellClient.stopCall();
        }
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }

    updateTranscript(transcript) {
        document.getElementById('transcript').textContent = transcript;
    }

    setButtonActive(agentType, isActive) {
        const buttons = document.querySelectorAll('.voice-btn');
        buttons.forEach(btn => {
            if (btn.onclick.toString().includes(agentType)) {
                if (isActive) {
                    btn.classList.add('active');
                    btn.textContent = '🔴 Connected';
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    resetButtons() {
        const buttons = document.querySelectorAll('.voice-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.onclick.toString().includes('support')) {
                btn.textContent = 'Talk to Support';
            } else if (btn.onclick.toString().includes('sales')) {
                btn.textContent = 'Talk to Sales';
            } else if (btn.onclick.toString().includes('consultant')) {
                btn.textContent = 'Talk to Advisor';
            }
        });
    }

    showCallControls(show) {
        document.getElementById('endCallBtn').style.display = show ? 'block' : 'none';
        document.getElementById('floatingEndBtn').style.display = show ? 'block' : 'none';
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
}

let voiceAssistant;

document.addEventListener('DOMContentLoaded', () => {
    voiceAssistant = new VoiceAssistant();
});

function startVoiceCall(agentType) {
    voiceAssistant.startCall(agentType);
}

function endCall() {
    voiceAssistant.endCall();
}
