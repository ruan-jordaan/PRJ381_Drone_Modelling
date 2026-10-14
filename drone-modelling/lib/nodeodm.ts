import { uint } from "three/tsl";

const NODEODM_URL = process.env.NODEODM_URL || 'http://localhost:3000';

export interface NodeODMTaskStatus {
    taskId: string;
    status: {
        code: number; 
    };
    progress: number;
}

export async function createNodeODMTask(imageUrls: string[]): Promise<string> {
    const formData = new FormData();

    for (let i = 0; i < imageUrls.length; i++) {
      const res = await fetch(imageUrls[i]);

      if (!res.ok) {
        throw new Error(
               `Failed to download image ${i + 1} for NodeODM: ${res.status} ${res.statusText}`
           );
         
      }

        const blob = await res.blob();

        formData.append(
            "images",
            blob,
            `image_${i + 1}.jpg`
        );
    }

    formData.append('options', JSON.stringify([
        { name: 'auto-boundary', value: true },
        { name: 'dsm', value: true}
    ]));

    const response = await fetch(`${NODEODM_URL}/task/new`,{
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
    throw new Error(
        `NodeODM task creation failed: ${response.status} ${response.statusText}`
    );
}

    const data = await response.json();

    if (!data.uuid) {
        throw new Error("NodeODM did not return a task UUID.");
    }

    return data.uuid;

}


export async function getNodeODMTaskStatus(uuid: string): Promise<NodeODMTaskStatus>{
    const response = await fetch(`${NODEODM_URL}/task/${uuid}/info`);
    if (!response.ok) {
        throw new Error(`Failed to fetch status for task ${uuid}`);  
    }
    const data = await response.json();
    return{
        taskId: data.uuid,
        status: data.status,
        progress: data.progress,
    };
}


export function getNodeODMModelUrl(taskId: string): string {
    return `${NODEODM_URL}/task/${taskId}/download/model.glb`;
}