/* This typing allows react-tinymce 0.6.0 to be used from TypeScript (.tsx) */

declare module 'react-tinymce' {
    import React = require('react');
    import * as ActualTinyMCE from 'tinymce';

    let TinyMCE: React.ClassicComponentClass<{
        config?: ActualTinyMCE.Settings,
        content?: string
    }>;
    export = TinyMCE;
}
