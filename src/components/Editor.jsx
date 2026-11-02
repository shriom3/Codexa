import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/python/python';
import 'codemirror/mode/go/go';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/php/php';
import 'codemirror/mode/rust/rust';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions.js';
import LANGUAGES from '../languages.js';

const Editor = ({ socketRef, roomId, onCodeChange, language }) => {
    const editorRef = useRef(null);
    const textareaRef = useRef(null); // Ref for the textarea

    useEffect(() => {
        if (!textareaRef.current) return;

        editorRef.current = Codemirror.fromTextArea(textareaRef.current, {
            mode: LANGUAGES.find((option) => option.value === language)?.editorMode || 'javascript',
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
        });

        editorRef.current.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange(code);

            if (origin !== 'setValue' && socketRef.current) {
                socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
            }
        });

        return () => {
            editorRef.current.toTextArea(); // Clean up
        };
    }, []);

    useEffect(() => {
        const selectedLanguage = LANGUAGES.find((option) => option.value === language);
        if (selectedLanguage && editorRef.current) {
            editorRef.current.setOption('mode', selectedLanguage.editorMode);
        }
    }, [language]);

    useEffect(() => {
        if (!socketRef.current || !editorRef.current) return;

        const handleCodeChange = ({ code }) => {
            if (code !== editorRef.current.getValue()) {
                editorRef.current.setValue(code);
            }
        };

        socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        };
    }, [socketRef, editorRef.current]);

    return <textarea ref={textareaRef} id="realtimeEditor"></textarea>;
};

export default Editor;
