# Browser Harness Rules for Agents

For browser work, use the Browser Harness integration only through the Control
Tower browser gateway.

Never:

- attach to the user's personal Chrome profile;
- bypass the policy gate;
- treat a click as proof of success;
- guess after an unexpected UI change;
- store cookies or tokens;
- enable recordings without a justified task;
- introduce Search-2 into browser workflows;
- expose unrestricted CDP to ordinary agents.

Always:

1. validate the target;
2. acquire a browser lease;
3. operate in READ_ONLY unless a write capability is explicitly authorized;
4. verify the post-condition;
5. return evidence;
6. release the browser lease.
