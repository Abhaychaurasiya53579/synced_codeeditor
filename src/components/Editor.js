// components/Editor.js
import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';
import "../App.css"

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    const [output, setOutput] = useState('');

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            editorRef.current.on("change", (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== "setValue") {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code != null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    const runCode = () => {
        try {
            const code = editorRef.current.getValue();
            const logCapture = [];
            const consoleLog = console.log;
            console.log = (...args) => {
                logCapture.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
                consoleLog.apply(console, args);
            };
            const result = eval(code);
            console.log = consoleLog;
            setOutput(logCapture.join('\n'));
        } catch (error) {
            console.error(error);
            setOutput(`Error: ${error.message}`);
        }
    };

    return (
        <div className="code_editor_area">
            <textarea  id="realtimeEditor"></textarea>
            <div  className="parent_run_code_button">
            <button className="run_code_button" onClick={runCode}>Run Code</button>
            </div>
            
            <div className="output_area">
                {output && (
                    <div className="out" style={{ marginTop: '0', padding: '10px', backgroundColor: '#333', borderRadius: '5px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                        {output}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Editor;
