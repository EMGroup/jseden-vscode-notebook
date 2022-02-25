let cli = require("./js-eden/js/cli.js");
cli.CLIEden.Eden.projectPath = process.cwd() + "/js-eden/";
function symbolChanged(sym, kind){
    var latestSymbolName = sym.name;
    var latestValue;
    if(sym.cache.up_to_date){
        latestValue = sym.cache.value;
    }else{
        latestValue = sym.value();
    }
    var outputMessage = "";
    if(sym.definition){
        outputMessage = "[" + sym.getSource() + "]: " + latestValue;
    }else{
        outputMessage = latestSymbolName + ": " + latestValue;
    }
    console.log(outputMessage);
}
cli.CLIEden.startCommandLine();
cli.CLIEden.eden.root.addGlobal(symbolChanged);