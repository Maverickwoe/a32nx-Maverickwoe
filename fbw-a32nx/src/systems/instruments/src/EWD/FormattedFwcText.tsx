import { DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';

interface FormattedFwcTextProps {
    message: Subscribable<string>;
    x: number;
    y: number;
}
export class FormattedFwcText extends DisplayComponent<FormattedFwcTextProps> {
    private linesRef = FSComponent.createRef<SVGGElement>();

    private decorationRef = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.message.sub((message) => {
            const LINE_SPACING = 30;
            const LETTER_WIDTH = 16;

            this.linesRef.instance.innerHTML = '';
            this.decorationRef.instance.innerHTML = '';

            let spans: Node[] = [];
            let yOffset = 0;

            let color = 'White';
            let underlined = false;
            // const flashing = false; TODO
            let framed = false;

            let buffer = '';
            let startCol = 0;
            let col = 0;
            for (let i = 0; i < message.length; i++) {
                const char = message[i];
                if (char === '\x1b' || char === '\r') {
                    if (buffer !== '') {
                        // close current part
                        const s = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        s.setAttribute('key', buffer);
                        s.setAttribute('class', `${color} EWDWarn`);
                        s.textContent = buffer;
                        spans.push(s);
                        buffer = '';

                        if (underlined) {
                            const d = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            d.setAttribute('class', `Undeline ${color}Line`);
                            d.setAttribute('strokeLinecap', 'round');
                            d.setAttribute('d', `M ${this.props.x + (startCol * LETTER_WIDTH)} ${this.props.y + (yOffset + 4)} h ${(col - startCol) * LETTER_WIDTH + 5}`);
                            this.decorationRef.instance.appendChild(d);
                        }

                        if (framed) {
                            const d = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            d.setAttribute('class', `Undeline ${color}Line`);
                            d.setAttribute('strokeLinecap', 'round');
                            d.setAttribute('d', `M ${this.props.x + (startCol * LETTER_WIDTH)}
                                ${this.props.y + (yOffset) - 22} h ${(col - startCol) * LETTER_WIDTH + 12} v 27 h ${-((col - startCol) * LETTER_WIDTH + 12)} v -27`);
                            this.decorationRef.instance.appendChild(d);
                        }

                        startCol = col;
                    }

                    if (char === '\x1B') {
                        let ctrlBuffer = '';
                        i++;
                        for (; i < message.length; i++) {
                            ctrlBuffer += message[i];

                            let match = true;
                            switch (ctrlBuffer) {
                            case 'm':
                                // Reset attribute
                                underlined = false;
                                // flashing = false;
                                framed = false;
                                break;
                            case '4m':
                                // Underlined attribute
                                underlined = true;
                                break;
                            case ')m':
                                // Flashing attribute
                                // flashing = true;
                                break;
                            case "'m":
                                // Characters which follow must be framed
                                framed = true;
                                break;
                            case '<1m':
                                // Select YELLOW
                                color = 'Yellow';
                                break;
                            case '<2m':
                                // Select RED
                                color = 'Red';
                                break;
                            case '<3m':
                                // Select GREEN
                                color = 'Green';
                                break;
                            case '<4m':
                                // Select AMBER
                                color = 'Amber';
                                break;
                            case '<5m':
                                // Select CYAN (blue-green)
                                color = 'Cyan';
                                break;
                            case '<6m':
                                // Select MAGENTA
                                color = 'Magenta';
                                break;
                            case '<7m':
                                // Select WHITE
                                color = 'White';
                                break;
                            default:
                                match = false;
                                break;
                            }

                            if (match) {
                                break;
                            }
                        }

                        continue;
                    }

                    if (char === '\r') {
                        const e = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        e.setAttribute('x', this.props.x.toString());
                        e.setAttribute('y', (this.props.y + yOffset).toString());
                        spans.forEach((s) => {
                            e.appendChild(s);
                        });
                        this.linesRef.instance.appendChild(e);
                        yOffset += LINE_SPACING;

                        spans = [];
                        col = 0;
                        startCol = 0;
                        continue;
                    }
                }

                buffer += char;
                col++;
            }

            if (buffer !== '') {
                const s = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                s.setAttribute('key', buffer);
                s.setAttribute('class', `${color} EWDWarn`);
                s.textContent = buffer;
                spans.push(s);
            }

            if (spans.length) {
                const e = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                e.setAttribute('x', this.props.x.toString());
                e.setAttribute('y', (this.props.y + yOffset).toString());
                spans.forEach((s) => {
                    e.appendChild(s);
                });
                this.linesRef.instance.appendChild(e);
                yOffset += LINE_SPACING;
            }
        });
    }

    render(): VNode {
        return (
            <g>
                <g ref={this.linesRef} />
                <g ref={this.decorationRef} />
            </g>
        );
    }
}
