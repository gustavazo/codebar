import { useRef, useState, useEffect } from 'react';

const CODEBAR_NUMBER_THRESHOLD = 6;
let i = 0;

const useCodebarScanner = () => {
    const keyboardInput = useRef("");
    const [productCodebar, setProductCodebar] = useState("");

    useEffect(() => {
        window.addEventListener('keydown', productAdded);

        return () => window.removeEventListener('keydown', productAdded);
    }, []);

    const productAdded = (e) => {
        if (Number(e.key) !== NaN) {
            const currentLength = keyboardInput.current.length;
            keyboardInput.current += e.key;

            setTimeout(() => {
                if (keyboardInput.current === "" && productCodebar) {
                    setProductCodebar("");
                }

                if ((keyboardInput.current.length - currentLength >= CODEBAR_NUMBER_THRESHOLD) && !productCodebar) {
                    const productCodebarId = keyboardInput.current.match(/\d+/);

                    if (productCodebarId) {
                        setProductCodebar(i + productCodebarId);
                        keyboardInput.current = "";

                        if (i === 9) {
                            i = 0;
                        } else {
                            i++;
                        }
                    }
                } else {
                    keyboardInput.current = "";
                }
            }, 1000);
        }
    };
    
    return productCodebar;
};

export default useCodebarScanner;