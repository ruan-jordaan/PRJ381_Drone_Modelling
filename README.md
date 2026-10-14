# PRJ381_Drone_Modelling
Github Repo for our PRJ381 project

Drone capturing documentation
----------
Capturing
----------
Equipment used:
Drone and controllers : DJI Neo Model-> DN1A0626, DJI Goggles N3 , RC Motion controller
App: DJI Fly 
Storage: DJI Neo has build in storage that can be exported through the DJI Fly app to a mobile device

---------
Capturing process: 
---------
The capturing was conducted in several different methods until we found a optimal method. 

In the planning stage we had planned all the capturing for the drone to make use of lidar and GPS and when we started doing reseach on the drones we have on campus we realized that we had to make another plan. Then we planned on building a attachment for a lidar sensor on the drone but as it is not our property and the campuses we could not make any modifications on the drone.

We ended up going the WebODM/NodeODM route by using photogrammetry instead of GPS and Lidar as this was our only way forward.

We started by capturing only a 360 view of one car in the parking area to understand how the DJI Fly app works and what type of images we need for the WEBODM to succesfully create a 3D model. 

Upon using the WebODM we noticed that the model was completely out of proportion and had a lot of random points scattered all over. We investigated the cause and found that we did not have enough images overlapping to process and render a 3D model. 

With that in mind we took a second attempt with more overlapping images that was in total about 60 images. Once we exported the newly acquired images we tried our second attempt. With this attempt we had alot more success but still had some unexplainable points that did not link to any specific points.

There was some more research done and with a third attempt at capturing we finally got the 3D model to render correctly. With this attempt we took a different approach. We realized through our trail and failure there was still something missing. We eventually stumbled upon a different capturing approach where we took overlapping images from 3 diffrent heights and angles. 

-First one being 2m above ground all around the incident to get object level capturing. 

-Secondly we captured images from a +- 45 degree angle at a height of 6-7 meters also circling around the incident zone with the incident in the middle. 

-Lastly we also had a 90 degree angle at a height of about 18m to get the top down images that helped to get a better visualization of the area around the objects that collided and helping the rendering to be better scaled. 

----------
Processing
----------
After each session we had to export each image to an alternative device to share it with the WEBODM software and other members to use for integration and 3D model prossessing and rendering. We made use of our mobile devices to export the images from the app to our local devices and then uploaded them to a google drive with a link that was shared on our project group

----------
File type: 
----------
The images was exported as individual JPG files that we shared on google drive

----------
Lessons learned
----------
Do research before hand on what software you will be using and what the software requires to render a full 3D model with all the data point connecting as they should. 

Make sure you have the hardware required before heading into a direction because with the wrong hardware you will have to use a different approach to the planning and the scope.
