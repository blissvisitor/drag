window.onload = function () {
    const SNAP_DISTANCE = 10; // Set your snap distance

    /**
     * @description: Calculate the distance between two DOM elements
     * @param {DOM} dom1
     * @param {DOM} dom2
     * @param {Number} distance
     * @return: {Number} diagonalDistance
     * @example: diagonalDistance(dom1, dom2, distance)
     **/
    function diagonalDistance(dom1, dom2, distance) {
        if (dom1 && dom2) {
            let minDistance = calculateMinDistance(dom1, dom2);
            if (minDistance < 0) {
                return false;
            }
            return minDistance < distance;
        }
        return false;
    }
    // Calculate the minimum distance between two DOM elements
    function calculateMinDistance(div1, div2) {
        let rect1 = div1.getBoundingClientRect();
        let rect2 = div2.getBoundingClientRect();

        let center1 = {
            x: rect1.left + rect1.width / 2,
            y: rect1.top + rect1.height / 2
        };

        let center2 = {
            x: rect2.left + rect2.width / 2,
            y: rect2.top + rect2.height / 2
        };

        let dx = Math.abs(center2.x - center1.x);
        let dy = Math.abs(center2.y - center1.y);

        if (dx < (rect1.width + rect2.width) / 2 && dy >= (rect1.height + rect2.height) / 2) {
            return dy - (rect1.height + rect2.height) / 2;
        } else if (dx >= (rect1.width + rect2.width) / 2 && dy < (rect1.height + rect2.height) / 2) {
            return dx - (rect1.width + rect2.width) / 2;
        }
        //  else if (dx >= (rect1.width + rect2.width) / 2 && dy >= (rect1.height + rect2.height) / 2) {
        //     let delta_x = dx - (rect1.width + rect2.width) / 2;
        //     let delta_y = dy - (rect1.height + rect2.height) / 2;
        //     return Math.sqrt(delta_x * delta_x + delta_y * delta_y);
        // } 
        else {
            return -1; // 两个div相交，返回-1
        }
    }
    function dragMoveListener(event) {
        let target = event.target
        // keep the dragged position in the data-x/data-y attributes
        let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
        let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

        // translate the element
        target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
        // update the posiion attributes
        target.setAttribute('data-x', x)
        target.setAttribute('data-y', y)
    }
    // Set the component to be draggable
    interact('#comp').draggable({
        inertia: true,
        autoScroll: true,
        listeners: {}
    });
    // enable draggables to be dropped into this
    interact('.container').dropzone({
        // only accept elements matching this CSS selector
        accept: '#comp',
        // listen for drop related events:
        ondropactivate: function (event) {
            // add active dropzone feedback
            event.target.classList.add('drop-active')
        },
        ondragenter: function (event) {
            let draggableElement = event.relatedTarget
            let dropzoneElement = event.target
            // feedback the possibility of a drop
            dropzoneElement.classList.add('drop-target')
        },
        ondragleave: function (event) {
            console.log(event + 'drag-leave')
            // remove the drop feedback style
            event.target.classList.remove('drop-target')
        },
        ondrop: function (event) {
            event.target.classList.remove('drop-target')
            event.target.classList.remove('drop-active')
            let newComp = event.relatedTarget.cloneNode(true);
            // make the clone a little smaller
            newComp.style.position = 'absolute';
            newComp.setAttribute('id', 'comp' + (document.querySelectorAll('.container > div').length + 1));
            newComp.style.left = event.dragEvent.pageX + 'px';
            newComp.style.top = event.dragEvent.pageY + 'px';
            document.querySelector('.container').appendChild(newComp);
        },
        ondropdeactivate: function (event) {
            // remove active dropzone feedback
            event.target.classList.remove('drop-active')
            event.target.classList.remove('drop-target')
        }
    }) 
    // Set the components on the canvas to be draggable and resizable
    interact('.container > div').draggable({
        modifiers: [
            // interact.modifiers.snap({
            //     targets: [
            //         interact.createSnapGrid({
            //             x: SNAP_DISTANCE,
            //             y: SNAP_DISTANCE,
            //             range: SNAP_DISTANCE,
            //         }),
            //     ],
            //     relativePoints: [{
            //         x: 0,
            //         y: 0
            //     }],
            //     endOnly: true,
            // }),
            interact.modifiers.restrict({
                restriction: 'parent',
                elementRect: {
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0
                }
            })
        ],
        listeners: {
            // call this function on every dragmove event
            move: dragMoveListener,
            // call this function on every dragend event
        }
    }).resizable({
        // resize from all edges and corners
        edges: {
            left: true,
            right: true,
            bottom: true,
            top: true
        },

        listeners: {
            move(event) {
                let target = event.target
                let x = (parseFloat(target.getAttribute('data-x')) || 0)
                let y = (parseFloat(target.getAttribute('data-y')) || 0)

                // update the element's style
                target.style.width = event.rect.width + 'px'
                target.style.height = event.rect.height + 'px'

                // translate when resizing from top or left edges
                x += event.deltaRect.left
                y += event.deltaRect.top

                target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

                target.setAttribute('data-x', x)
                target.setAttribute('data-y', y)
                // target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)
            }
        },
        modifiers: [
            // keep the edges inside the parent
            interact.modifiers.restrictEdges({
                outer: 'parent'
            }),

            // minimum size
            interact.modifiers.restrictSize({
                min: {
                    width: 100,
                    height: 50
                }
            })
        ],

        inertia: true
    })
    // 吸附和对齐
    interact('.container > div').on('dragmove', function (event) {
        console.log(event.type)
        let target = event.target;
        let x = (parseFloat(target.getAttribute('data-x')) || 0)
        let y = (parseFloat(target.getAttribute('data-y')) || 0)
        let targetRect = target.getBoundingClientRect();
        // Check the distance between the component and other components
        let otherComps = document.querySelectorAll(`.container > div:not(#${target.id})`);
        otherComps.forEach(function (comp) {
            let rect = comp.getBoundingClientRect();
            // 对齐效果
            if (Math.abs(targetRect.left - rect.left) < SNAP_DISTANCE) {
                // x = (parseFloat(comp.getAttribute('data-x')) || 0)
                console.log('1111')
                target.style.left = rect.left + 'px'; // Align the left borders
                x = 0
                target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                // return;
            }
            // 吸附效果
            if (diagonalDistance(target, comp, SNAP_DISTANCE)) {
                // top to bottom
                if (Math.abs(targetRect.top - rect.top - rect.height) < SNAP_DISTANCE) {
                    target.style.top = rect.top + rect.height + 'px'; // Adsorb to the top
                    y = 0
                }
                // right to left
                if (Math.abs((targetRect.left + targetRect.width) - rect.left) < SNAP_DISTANCE) {
                    target.style.left = rect.left - targetRect.width + 'px'; // Adsorb to the right
                    x = 0
                }
                // bottom to top
                if (Math.abs((targetRect.top + targetRect.height) - rect.top) < SNAP_DISTANCE) {
                    target.style.top = rect.top - targetRect.height + 'px'; // Adsorb to the bottom
                    y = 0
                }
                // left to right
                if (Math.abs(targetRect.left - rect.left - rect.width) < SNAP_DISTANCE) {
                    target.style.left = rect.left + rect.width + 'px'; // Align the left borders
                    x = 0
                }
                target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                // return
            }
        });
    });


}