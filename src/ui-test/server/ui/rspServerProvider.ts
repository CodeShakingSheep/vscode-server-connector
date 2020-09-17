import { InputBox, ViewItem, Workbench, TreeItem, VSBrowser } from "vscode-extension-tester";
import { AdaptersConstants } from "../../common/adaptersContants";
import { Server } from "./server";
import { AbstractServer } from "./abstractServer";
import { IServersProvider } from "./IServersProvider";


/**
 * RSP Server Provider item representation
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export class RSPServerProvider extends AbstractServer {

    private _serversProvider: IServersProvider;

    constructor(sbar: IServersProvider, name: string) {
        super(name);
        this._serversProvider = sbar;
    }

    public get serversProvider(): IServersProvider {
        return this._serversProvider;
    }

    public async getTreeItem(): Promise<ViewItem> {
        const section = await this.serversProvider.getServerProviderTreeSection();
        await VSBrowser.instance.driver.wait( async () => (await section.getVisibleItems()).length > 0, 3000);
        const rspServerItem = await section.findItem(this.serverName);
        if (!rspServerItem) {
            const availableItems = await Promise.all((await section.getVisibleItems()).map(async item => await item.getText()));
            throw Error(`No item found for name ${this.serverName} available items: ${availableItems}`);
        }
        return rspServerItem;
    }

    public async getServers(): Promise<Server[]> {
        const servers = [];
        const items = await (await this.getTreeItem() as TreeItem).getChildren();
        for (const item of items) {
            const label = await item.getLabel();
            servers.push(new Server(label, this));
        }
        return servers;
    }

    public async getServer(name: string): Promise<Server> {
        const items = await (await this.getTreeItem() as TreeItem).getChildren();
        for (const item of items) {
            const label = await item.getLabel();
            if (label === name) {
                return new Server(label, this);
            }
        }
        throw Error(`Server ${name} does not exist`);
    }

    public async getCreateNewServerBox(): Promise<InputBox> {
        const item = await this.getTreeItem();
        const menu = await item.openContextMenu();
        await VSBrowser.instance.driver.wait(async () => await menu.hasItem(AdaptersConstants.RSP_SERVER_PROVIDER_CREATE_NEW_SERVER), 2000);
        await menu.select(AdaptersConstants.RSP_SERVER_PROVIDER_CREATE_NEW_SERVER);
        return await InputBox.create();
    }

    public async createNewServerCommand(): Promise<void> {
        await new Workbench().executeCommand(`${AdaptersConstants.RSP_COMMAND} ${AdaptersConstants.RSP_SERVER_PROVIDER_CREATE_NEW_SERVER}`);
    }

    public delete(): Promise<void> {
        throw Error('RSP Server does not support delete operation');
    }

}