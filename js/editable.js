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

        let type = options.type = options.type || this.data('type');
        this.state = this.state || STATE_DISABLE;
        options.value = this.text() || this.attr('value') || options.value;
        this.inPlaceInput = this.inPlaceInput || new $ipe.types[type].InputConstructor(options);

        this.text(this.inPlaceInput.value);

        this.css($ipe.style.linkText);

        let submit = () => {
            $(document).off(".inPlace");
            let value = this.inPlaceInput.submit();
            this.show();
            this.text(value);
            this.state = !this.state };

        let dismiss = () => {
            $(document).off(".inPlace");
            this.inPlaceInput.dismiss();
            this.show();
            this.state = !this.state };

        // События
        this.click(event => {
            if (STATE_DISABLE == this.state) {
                this.inPlaceInput.inputForm.insertAfter(this);
                this.hide();
                this.inPlaceInput.inputField.focus();

                $(document).on('mousedown.inPlace', document, (e) =>
                {
                    let container = this.inPlaceInput.inputForm;
                    if (!container.is(e.target) // if the target of the click isn't the container...
                        && container.has(e.target).length === 0) // ... nor a descendant of the container
                    {
                        dismiss();
                    }
                });

                this.inPlaceInput.inputForm.find("#inplace-submit").click(() => {
                    console.log("Submit click");
                    submit();
                    return false;
                });

                this.inPlaceInput.inputForm.keyup(e => {
                    if(e.keyCode == 13) {
                        console.log("Key13");
                        submit();
                    } else if (e.keyCode == 27) {
                        console.log("Key27");
                        dismiss();
                    }
                    return false;
                });
            }
            this.state = !this.state;
            return false;
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
            this.size = options.size;
            this._value = null;
            this.value = options.value;

            this._inputField = null;
            this._inputForm = null }
        get inputForm() {};
        get inputField() {};
        generateInputField() {};
        generateButton() {
            let btn = $("<a>").attr('id', 'inplace-submit');
            btn.addClass("btn btn-success");
            if (this.size) {
                btn.addClass(`btn-${this.size}`) }
            return btn }
        removeField() {};
        initInputFieldValue() {}
        get value() { return this._value};
        set value(newVal) {this._value = newVal};
        submit() {
            this.value = this._inputField.val();
            console.log(`Submit with ${this.value}`);
            this.removeForm();
            return this.value }

        removeForm() {
            this._inputField.remove();
            this._inputForm.remove();
            this._inputField = this._inputForm = null }

        dismiss() {
            console.log("Dissmiss");
            this.removeForm() }
    };

    $ipe.InPlaceTextInput = class InPlaceTextInput extends $ipe.InPlaceInput {
        constructor(options) {
            super(options);
        }
        get inputForm() {
            console.log(this._value);
            if (null == this._inputForm) {
                this._inputForm = $("<div>").attr('id', `in-place-form-${this.id}`).addClass("form-inline").append(
                    $("<div>").addClass("form-group").append(
                        this.inputField,
                        this.generateButton().append(
                            $("<i>").addClass('fa fa-check')))) }

            this.initInputFieldValue();
            return this._inputForm;
        }

        get inputField() {
            if (null == this._inputField) {
                this._inputField = this.generateInputField();
            }
            return this._inputField }

        generateInputField() {
            let input = $("<input>")
                .attr('id', `in-place-input-field-${this.id}`)
                .attr('type', this.type)
                .attr('placeholder', this.placeholder);
            input.addClass("form-control");
            if (this.size) {
                input.addClass(`form-control-${this.size}`) }
            return input }

        initInputFieldValue() {
            this._inputField.val(this._value);
        }

        get value() {
            if (null != this._inputField)
                this._value = this._inputField.val();
            return this._value }

        set value(newVal) {
            this._value = newVal;
            if (null != this._inputField)
                this.initInputFieldValue() }
    };

    $ipe.InPlaceDateInput = class InPlaceDateInput extends $ipe.InPlaceTextInput {
        get value() {
            if (null != this._inputField)
                this._value = this._inputField.val();
            return moment(this._value, "YYYY-MM-DD").format("DD.MM.YYYY");
        }
        set value(newVal) {
            let m = moment(newVal, "DD.MM.YYYY");
            if (!m.isValid()) {
                m = moment(newVal, "YYYY-MM-DD");
            }
            this._value = m.format("YYYY-MM-DD");
            if (null != this._inputField)
                this.initInputFieldValue()
        }
    };

    $ipe.defaults = {
        placeholder: "",
        value: null,
        size: "sm"
    };

    $ipe.style = {
        linkText: {
            'border-bottom': "1px dashed gray",
            'color': '#0275d8'
        }
    };

    $ipe.types = {
        text: {
            InputConstructor: $ipe.InPlaceTextInput },
        number: {
            InputConstructor: $ipe.InPlaceTextInput },
        email: {
            InputConstructor: $ipe.InPlaceTextInput },
        url: {
            InputConstructor: $ipe.InPlaceTextInput },
        tel: {
            InputConstructor: $ipe.InPlaceTextInput },
        'datetime-local': {
            InputConstructor: $ipe.InPlaceTextInput },
        date: {
            InputConstructor: $ipe.InPlaceDateInput },
        // month: {
        //     InputConstructor: $ipe.InPlaceTextInput },
        // week: {
        //     InputConstructor: $ipe.InPlaceTextInput },
        time: {
            InputConstructor: $ipe.InPlaceTextInput },
        color: {
            InputConstructor: $ipe.InPlaceTextInput },
    };
}( jQuery ));