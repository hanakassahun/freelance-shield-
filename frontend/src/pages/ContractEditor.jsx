import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';

export default function ContractEditor() {
  const editorInstance = useRef(null);

  useEffect(() => {
    if (!editorInstance.current) {
      const editor = new EditorJS({
        holder: 'editorjs-holder',
        autofocus: true,
        placeholder: '✨ Start drafting your freelance contract terms here...',
        data: {
          time: Date.now(),
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: '<b>MUTUAL NON-DISCLOSURE AGREEMENT</b>'
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'This agreement protects project data shared between Freelancer and Client...'
              }
            }
          ]
        },
        onChange: async () => {
          const savedData = await editor.save();
          console.log('Live Contract JSON Output:', savedData);
        }
      });

      editorInstance.current = editor;
    }

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, []);

  const handleSaveToDatabase = async () => {
    if (editorInstance.current) {
      const outputData = await editorInstance.current.save();
      alert('Contract Blocks Saved Successfully! Check your browser console.');
      console.log('Payload ready for your Sequelize API backend:', JSON.stringify(outputData, null, 2));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400">📝 Next-Gen Contract Workspace</h1>
          <p className="text-sm text-gray-400 mt-1">Powered by an open-source, block-styled engine.</p>
        </div>
        <button
          onClick={handleSaveToDatabase}
          className="bg-emerald-600 hover:bg-emerald-500 font-semibold px-5 py-2 rounded-lg transition shadow-md"
        >
          Save Structure
        </button>
      </div>

      <div className="bg-gray-950 p-8 rounded-xl border border-gray-800 shadow-inner min-h-[500px]">
        <div
          id="editorjs-holder"
          className="prose prose-invert max-w-none text-gray-200 focus:outline-none"
        />
      </div>
    </div>
  );
}
