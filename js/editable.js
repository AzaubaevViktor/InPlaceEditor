(function( $ ) {
    const STATE_DISABLE = false;
    const STATE_ENABLE = true;
    $.fn.inPlace = function (action) {
        let options = $.extend({}, $ipe.defaults);
        // Initialization
        if ('object' == (typeof action)) {
            $.extend(options, action);
        } else if ((undefined == action) || ('enable' == action)) {
        } else if ( action === "disable" ) {
            // Disable code.
        } else return this;

        let type = this.data('type');
        this.state = this.state || STATE_DISABLE;
        this.inPlaceInput = this.inPlaceInput || new $ipe.types[type].InputConstructor(options);
        this.css($ipe.style.linkText);

        // События
        this.click((event) => {
            if (STATE_DISABLE == this.state) {
                this.inPlaceInput.inputField.insertAfter(this);
                this.inPlaceInput.value = this.text() || options.value;
                this.hide();
                this.inPlaceInput.inputField.focus();

                this.inPlaceInput.inputField.focusout(() => {
                    console.log("Dissmiss");
                    this.inPlaceInput.inputField.remove();
                    this.show();
                    this.state = !this.state;
                });
                this.inPlaceInput.inputField.keyup(e => {
                    if(e.keyCode == 13) {
                        console.log(this.inPlaceInput.value);
                        this.inPlaceInput.inputField.remove();
                        this.show();
                        this.text(this.inPlaceInput.value);
                        this.state = !this.state;
                    }
                });

            }
            this.state = !this.state;
        });


        return this;
    };

    let $ipe = $.fn.inPlace;

    $ipe.InPlaceInput = class InPlaceInput {
        constructor(options) {
            this.options = options;
            this.id = options.id;
            this.type = options.type;
            this.placeholder = options.placeholder;
            this._value = null;
            this.value = options.value;

            this.inputEl = null;
        }
        get inputField() {};
        removeField() {};
        get value() { return this._value};
        set value(newVal) {this._value = newVal};
    };

    $ipe.InPlaceTextInput = class InPlaceTextInput extends $ipe.InPlaceInput {
        get inputField() {
            if (undefined != this.inputEl) return this.inputEl;

            this.value = this._value;
            this.inputEl = $(`<input type="${this.type}" class="form-control" id="_in-place-editor-${this.id}" placeholder="${this.placeholder}">`);
            return this.inputEl}

        get value() {
            if (undefined != this.inputEl) return this.inputEl.val();
            else return this._value}

        set value(newVal) {
            this._value = newVal;
            if (undefined != this.inputEl) this.inputEl.val(newVal);
        }

        removeField() {
            this.value = this.inputEl.val();
            this.inputEl.remove();
            return this.value}
    };

    $ipe.defaults = {
        placeholder: "",
        value: null
    };

    $ipe.types = {
        text: {
            InputConstructor: $ipe.InPlaceTextInput
        }
    };

    $ipe.style = {
        linkText: {
            'border-bottom': "1px dashed gray",
            'color': '#0275d8'
        }
    }
}( jQuery ));