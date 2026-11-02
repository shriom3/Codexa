import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
import LANGUAGES from "../languages.js";

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef("");
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [output, setOutput] = useState("");
    const [language, setLanguage] = useState("cpp");
    const [userInput, setUserInput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const selectedLanguage =
    LANGUAGES.find((option) => option.value === language) || LANGUAGES[0];

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();

            socketRef.current.on("connect_error", (err) => handleErrors(err));
            socketRef.current.on("connect_failed", (err) => handleErrors(err));

            function handleErrors(e) {
                toast.error("Socket connection failed. Redirecting...");
                reactNavigator("/");
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId, language }) => {
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room.`);
                }
                setClients(clients);
                //setLanguage(language);
                const validLanguage = LANGUAGES.some(
    (option) => option.value === language
);

setLanguage(validLanguage ? language : "cpp");

                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId,
                });
            });

            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                codeRef.current = code;
            });

            socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language }) => {
                setLanguage(language);
            });

            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                toast.success(`${username} left the room.`);
                setClients((prev) => prev.filter((client) => client.socketId !== socketId));
            });
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
            }
        };
    }, []);

    const executeCode = async () => {
        setIsRunning(true);
        setOutput("Running your code...");
        const options = {
            method: "POST",
            url: "https://judge0-ce.p.rapidapi.com/submissions",
            params: { base64_encoded: "false", wait: "true" },
            headers: {
                "content-type": "application/json",
                "X-RapidAPI-Key": "849c6b413bmshe4226e25e12af8dp1b55b0jsn613c9cf0e560",
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
            data: {
                language_id: LANGUAGES.find((option) => option.value === language).judge0Id,
                source_code: codeRef.current,
                stdin: userInput,
            },
        };

        try {
            const response = await axios.request(options);
            setOutput(
                response.data.stdout
                || response.data.stderr
                || response.data.compile_output
                || response.data.message
                || "Program finished without output."
            );
        } catch (error) {
            setOutput(error.response?.data?.message || error.message || "Error executing code");
        } finally {
            setIsRunning(false);
        }
    };

    const handleLanguageChange = (event) => {
        const nextLanguage = event.target.value;
        setLanguage(nextLanguage);
        socketRef.current?.emit(ACTIONS.LANGUAGE_CHANGE, { roomId, language: nextLanguage });
    };

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success("Room ID copied!");
        } catch (err) {
            toast.error("Could not copy Room ID");
        }
    }

    function leaveRoom() {
        reactNavigator("/");
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <aside className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/codexa.svg" alt="Codexa logo" />
                    </div>
                    <div className="roomDetails">
                        <span className="roomDetailsLabel">ROOM</span>
                        <span className="roomIdValue" title={roomId}>{roomId}</span>
                        <button className="copyBtn" onClick={copyRoomId}>
                            Copy room ID
                        </button>
                    </div>
                    <div className="participantsHeading">
                        <h2>Collaborators</h2>
                        <span className="participantCount">{clients.length}</span>
                    </div>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className="leaveBtn" onClick={leaveRoom}>
                    <span aria-hidden="true">←</span> Leave room
                </button>
            </aside>
            <main className="workspace">
                <header className="workspaceHeader">
                    <div className="workspaceTitle">
                        <span className="workspaceEyebrow">CODING SESSION</span>
                        <h1>Collaborative editor</h1>
                    </div>
                    <div className="sessionStatus">
                        <span className="statusDot" />
                        Live session
                    </div>
                </header>
                <section className="editorPanel" aria-label="Code editor">
                    <div className="editorPanelHeader">
                        <div className="fileLabel">
                            <span className="fileIcon" aria-hidden="true">&lt;/&gt;</span>
                            <span>main</span>
                            <span className="fileExtension">.{selectedLanguage.extension}</span>
                        </div>
                        <span className="editorHint">Changes sync with everyone in this room</span>
                    </div>
                    <div className="editorSurface">
                        <Editor
                            socketRef={socketRef}
                            roomId={roomId}
                            language={language}
                            onCodeChange={(code) => {
                                codeRef.current = code;
                            }}
                        />
                    </div>
                    <div className="bottomSection">
                        <label className="languageControl">
                            <span>Language</span>
                            <select className="languageSelect" value={language} onChange={handleLanguageChange}>
                                {LANGUAGES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button className="btn runBtn" onClick={executeCode} disabled={isRunning}>
                            <span aria-hidden="true">{isRunning ? "◌" : "▶"}</span>
                            {isRunning ? "Running..." : "Run code"}
                        </button>
                    </div>
                </section>
                <section className="consolePanels" aria-label="Program input and output">
                    <div className="consolePanel">
                        <div className="consolePanelHeader">
                            <div>
                                <h2>Standard input</h2>
                                <p>Provide input for your program</p>
                            </div>
                            <span className="consoleTag">stdin</span>
                        </div>
                        <textarea
                            className="inputArea"
                            aria-label="Standard input"
                            placeholder="Type input here..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                        />
                    </div>
                    <div className="consolePanel outputPanel">
                        <div className="consolePanelHeader">
                            <div>
                                <h2>Output</h2>
                                <p>{isRunning ? "Executing your program..." : "Your program results will appear here"}</p>
                            </div>
                            <span className="consoleTag">console</span>
                        </div>
                        <pre className={`outputContent${output ? " hasOutput" : ""}`}>
                            {output || "Run your code to see the output here."}
                        </pre>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default EditorPage;
