import { System } from 'ecsy';

import Utils from '../../../shared/utils';
import Types from '../../../shared/types';
import Messages from '../../../shared/messages';
import * as Spawner from '../spawner';

import { Connection } from '../../../shared/components/connection';
import { Input } from '../../../shared/components/input';

export class NetworkEventSystem extends System {
  static queries = {
    connections: {
      components: [Connection, Input]
    }
  };

  init(worldServer) {
    this.worldServer = worldServer;
  }

  execute() {
    this.queries.connections.results.forEach((entity) => {
      const connection = entity.getComponent(Connection).value;

      while (connection.hasIncomingMessage()) {
        const message = connection.popMessage();

        switch (message.type) {
          case Types.Messages.HELLO: {
            let { name } = message.data;
            name = Utils.sanitize(name);
            name = !name ? 'UNKNOWN' : name.substr(0, 15);

            const spaceship = Spawner.controllableSpaceship(
              this.world,
              this.worldServer.clients[connection.id]
            );

            connection.pushMessage(new Messages.Welcome(spaceship.worldId, name));
            break;
          }
          case Types.Messages.INPUT: {
            const {
              forward, backward,
              rollLeft, rollRight,
              strafeLeft, strafeRight, strafeUp, strafeDown,
              boost, weaponPrimary, aim
            } = message.data;
            const component = entity.getMutableComponent(Input);

            component.forward = forward;
            component.backward = backward;
            component.rollLeft = rollLeft;
            component.rollRight = rollRight;
            component.strafeLeft = strafeLeft;
            component.strafeRight = strafeRight;
            component.strafeUp = strafeUp;
            component.strafeDown = strafeDown;
            component.boost = boost;
            component.weaponPrimary = weaponPrimary;
            component.aim = aim;
            break;
          }
        }
      }
    });
  }
}
