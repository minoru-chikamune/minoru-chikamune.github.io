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
      console.log(astToStr(evaluate(macroexpand(parse('(do ' + codeMirror.doc.getSelection() + ')')), globalEnv)));
    }
  }
});
