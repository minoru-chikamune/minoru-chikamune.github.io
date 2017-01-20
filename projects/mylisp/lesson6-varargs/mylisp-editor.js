CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  lineWrapping: true,
  fullScreen: true,
  smartIndent: false,
  undoDepth: 10000,
  autofocus: true,
  matchBrackets: true,
  styleActiveLine: true,
  //autoCloseBrackets: {pairs: "()\"\""},
  theme: 'mylisp',
  extraKeys: {
    "F2": function(codeMirror) {
      var jsInput = eval(codeMirror.doc.getSelection()); // JavaScriptの配列の形に変形
      console.log('JavaScript input -->', jsInput);
      console.log(' evaluate output -->', evaluate(jsInput, globalEnv));
    }
  }
});
