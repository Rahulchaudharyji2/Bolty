import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  SetDesiredCapacityCommand,
  TerminateInstanceInAutoScalingGroupCommand
} from "@aws-sdk/client-auto-scaling";
const { Ec2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
import express from "express";
const app = express();

const client = new AutoScalingClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: "YOUR_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
  },
});

const ec2Client = new Ec2Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "YOUR_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
  },
});

type Machine = {
  ip: string;
  isUsed: boolean;
  assignedProject?: string;
};
const All_MACHINES: Machine[] = [];
async function refreshInstances() {
  const command = new DescribeAutoScalingGroupsCommand();
  const data = await client.send(command);
  console.log(data);
  const ec2InstanceCommand = new DescribeInstancesCommand({
    InstanceIds: data.AutoScalingGroups?.[0]?.Instances?.map(
      (x) => x.InstanceId,
    ),
  });

  const ec2Response = await ec2Client.send(ec2InstanceCommand);
}
refreshInstances();
setInterval(() => {
  refreshInstances();
}, 10 * 1000);

app.get("/:projectId",(req,res)=>{
    const idleMachine=All_MACHINES.find(machine=>!machine.isUsed);
    if(!idleMachine){
        res.status(503).send("No idle machines available");
        return;
    }
    idleMachine.isUsed=true;
    const command = new SetDesiredCapacityCommand({
        AutoScalingGroupName: "vscode-asg",
        DesiredCapacity: All_MACHINES.length + (5 - All_MACHINES.filter(x => x.isUsed === false).length)

    })

    client.send(command);

    res.send({
        ip: idleMachine.ip
    });
})

app.post("/destroy",(req,res)=>{
    const machineId:string=req.body.machineId;
    const command = new TerminateInstanceInAutoScalingGroupCommand({
        InstanceId: machineId,
        ShouldDecrementDesiredCapacity: true
    })

    client.send(command);
})

app.listen(3000, () => {
  console.log("Worker Orchestrator is running on port 3000");
});