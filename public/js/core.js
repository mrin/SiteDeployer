$(document).ready(function(){
    $('[rel=confirm]').click(function(){
        if ( confirm($(this).attr('title')) ) {
            document.location = ($(this).attr('href'));
        }
        return false;
    });
});
