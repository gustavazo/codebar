export class MySerial {

    textDecoder;
    readableStreamClosed;
    reader;
    port;
    id;
    baudRate;
    listenerCallback;
    usbProductId;

    constructor(listenerCallback, usbProductId, baudRate = 9600) {
        this.baudRate = baudRate;
        this.listenerCallback = listenerCallback;
        this.usbProductId = usbProductId;

    }

    async portSelection() {
        let portSelected = false;
        if (!this.port) {
            const portLocal = await navigator.serial.requestPort();
            if (portLocal) {
                await this.portOpen(portLocal);
                portSelected = true;
                this.port = portLocal;
            }
        }
        return portSelected
    }
    async openDefaultPort() {
        let match = false;
        try {
            const ports = await navigator.serial.getPorts();
            let index;
            for (let i = 0; i < ports.length; i++) {
                const p = ports[i];
                if (await p.getInfo().usbProductId === this.usbProductId) {
                    index = i;
                    match = true;
                }
            }
            console.log('match', match)
            if (match) {
                await this.portOpen(ports[index]);
            } else {
                console.log('OpenDefaultPortEl puerto por defecto no se encuentra abierto')
            }
        }
        catch (error) {
            match = false;
            console.log('openDefaultPort Error!', error)
        }
        return match
    }

    async portOpen(portLocal) {
        try {
            if (!this.port) {
                await portLocal.open({ baudRate: 9600 });
                this.port = portLocal;
                console.log('Puerto abierto')
            }
        }
        catch (err) {
            alert("Error abriendo puerto: " + err);

        }
    }
    async portClose() {
        try {
            if (this.port) {
                await this.reader?.cancel();//Termina el reader. Cuando termina el reader devuelve done=true entonces puede cerrarse
                await this.port.close();//Una vez terminado el reader puede cerrarse el puerto
                this.port = null;

            }
        }
        catch (error) {
            alert("Error cerrando el puerto: " + error)
        }
    }
    async stopListening() {
        await this.reader.cancel();//Termina el reader. Cuando termina el reader devuelve done=true entonces puede cerrarse
    }

    async startListening() {
        // textDecoder = new TextDecoderStream();
        // readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        // reader = textDecoder.readable.getReader();
        if (!this.port) {
            alert('No hay puerto abierto')
            return
        }
        this.id = "";
        while (this.port.readable) {
            this.reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await this.reader.read();//Esto aguarda la recepción del dato hasta que no exista el dato no devuelve la promesa
                    this.id += value.toString();
                    console.log('reading...',value)
                    if (value.toString().startsWith("166")) {
                        console.log('setTimeOut!')
                        setTimeout(() => {
                            console.log('timeOut finish!!',this.id)
                            this.id = this.id.replaceAll(",", "");
                            this.listenerCallback(this.id);
                            this.id = "";
                        }, 1000);
                    }
                    if (done) {
                        // |reader| has been canceled.
                        this.reader.releaseLock();//Desbloquea el reader
                        return;
                    }
                }
            } catch (error) {
                alert("Reader: " + error)
            }
        }
    }
    async changeBaudRate(baudRate) {
        try {
            this.portClose();
            await this.port.open({ baudRate: baudRate });//Puede volverse a abrir con una nueva configuraci[on]
            this.baudRate = baudRate;
        }
        catch (error) {
            alert("Error en cambio de velocidad " + error);
        }
    }
}