$(document).ready(function(){
    isMobile()
})

$(window).on('resize', function(){
    isMobile()
})




function isMobile(){

    if(/Android|iPhone/i.test(navigator.userAgent)){
        $('body').addClass('is-mobile').removeClass('not-mobile');
    }else{
        $('body').removeClass('is-mobile').addClass('not-mobile');
    }

    console.log(/Android|iPhone/i.test(navigator.userAgent))
}

function openMenu() {
    $('body').addClass('mini-menu').removeClass('no-menu');
}

function closeMenu() {
    $('body').addClass('no-menu').removeClass('mini-menu');
}
