export default {
    mounted: (el: any) => {
        let text = el.innerText;
        text = text.split('_').map((word: any) => {
            return word.charAt(0).toUpperCase() + word.slice(1)
        }).join(' ');
        el.innerText = text;
    },
}