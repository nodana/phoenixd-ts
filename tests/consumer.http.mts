import { Phoenixd } from "@nodana/phoenixd-ts/http";
import type { NodeInfo } from "@nodana/phoenixd-ts/http";

const node = new Phoenixd("http://localhost:9740", "password");

const info: Promise<NodeInfo> = node.getInfo();

void info;
