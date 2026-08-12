/**
 * Dijeljena logika za @resize-end iz @vue-flow/node-resizer <NodeResizer> —
 * koriste je UseCaseNode/SystemBoundaryNode/NoteNode (uml.actor namjerno
 * nema resize, vidi napomenu u tim komponentama). Provjereno u
 * node_modules/@vue-flow/node-resizer/dist prije pisanja koda: resizeEnd
 * event.params.{x,y,width,height} su u ISTOM koordinatnom sistemu kao
 * node.position (relativno prema trenutnom parentu ako ga ima — resizer
 * interno čita node.position kao startNodeX/Y), pa se mogu direktno
 * proslijediti u resizeEndToCommand bez dodatne konverzije.
 */
import type { OnResizeEnd } from '@vue-flow/node-resizer';
import type { EditorContext } from '../../adapter/editor-context';
import { resizeEndToCommand } from '../../adapter/vueflow-adapter';

export function dispatchResizeEnd(
    id: string,
    event: OnResizeEnd,
    ctx: EditorContext,
): void {
    const cmd = resizeEndToCommand(
        id,
        {
            position: { x: event.params.x, y: event.params.y },
            size: { width: event.params.width, height: event.params.height },
        },
        ctx.doc,
    );

    if (cmd) {
        ctx.commandManager.dispatch(cmd);
    }
}
