let EdenScript = {};
EdenScript.fragments = {};

EdenScript.createAST = function(src){
    return new Eden.AST(src, undefined, this, {strict: true, noindex: true});
}

EdenScript.createFragment = function(title,cb){
    EdenScript.fragments[title] = new Eden.Fragment(title,cb);
}
module.exports = {EdenScript};

/*function(frag){

    if (this.fragment && this.fragment !== frag) {
        this.fragment.unlock();
        this.currentlineno = -1;
    }
    this.fragment = frag;

    if (frag === undefined) {
        this.gutter.clear();
        this.readonly = true;
        return;
    }

    // Make sure it is up-to-date
    var me = this;
    
    frag.reset(function() {

    if (frag.ast) {
        me.highlightContent(-1, 0);
        me.gutter.setBaseAST(frag.ast.script);
    }
    });
}*/