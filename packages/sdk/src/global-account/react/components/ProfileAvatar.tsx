// "use client";

// import { AnimatePresence, motion } from "framer-motion";
// import { useEffect, useState } from "react";
// import ClientOnly from "./custom/ClientOnly";

// interface ProfileAvatarProps {
//   avatarId: string;
//   timestamp?: number;
// }

// // this function was taken from b3-shared
// function createUrlFromAvatarId(avatarId: string, extension: string = "png"): string {
//   if (extension === "png") {
//     return `https://avatars.basement.fun/${avatarId}.png`;
//   }
//   return `https://models.readyplayer.me/${avatarId}.${extension}`;
// }

// // Sub component for the avatar image
// const ProfileAvatar = ({ avatarId, timestamp }: ProfileAvatarProps) => {
//   const [avatarLoading, setAvatarLoading] = useState(true);
//   const [avatarError, setAvatarError] = useState(false);
//   const [ReadyPlayerMeAvatar, setReadyPlayerMeAvatar] = useState<any>(null);
//   const [Vector3, setVector3] = useState<any>(null);
//   const [dependenciesLoaded, setDependenciesLoaded] = useState(false);

//   // Dynamically import dependencies only when component is used
//   useEffect(() => {
//     let isMounted = true;

//     const loadDependencies = async () => {
//       try {
//         const [visageModule, threeModule] = await Promise.all([
//           // @ts-ignore - Optional peer dependency
//           import("@readyplayerme/visage"),
//           // @ts-ignore - Optional peer dependency
//           import("three")
//         ]);

//         if (isMounted) {
//           setReadyPlayerMeAvatar(() => visageModule.Avatar);
//           setVector3(() => threeModule.Vector3);
//           setDependenciesLoaded(true);
//         }
//       } catch (error) {
//         console.warn("ProfileAvatar: 3D dependencies not available, falling back to 2D avatar:", error);
//         if (isMounted) {
//           setAvatarLoading(false);
//           setDependenciesLoaded(false);
//         }
//       }
//     };

//     loadDependencies();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   if (!avatarId) {
//     return (
//       <div className="flex h-full w-full items-center justify-center">
//         <p className="text-white/50">No avatar available</p>
//       </div>
//     );
//   }

//   return (
//     <AnimatePresence mode="wait">
//       {(avatarLoading || !dependenciesLoaded) && !avatarError && (
//         <motion.img
//           key="avatar-image"
//           src={`https://models.readyplayer.me/${avatarId}.png?camera=fullbody&size=1024&expression=happy&t=${timestamp || ""}`}
//           alt="avatar"
//           className="absolute left-0 top-0 h-full w-full object-cover"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.3, ease: "easeInOut" }}
//           onError={() => setAvatarError(true)}
//         />
//       )}
//       {dependenciesLoaded && (
//         <ClientOnly>
//           <motion.div
//             key={`avatar-3d-${timestamp}`}
//             className="absolute left-0 top-0 h-full w-full"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: avatarLoading ? 0 : 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.3, ease: "easeInOut" }}
//           >
//             {ReadyPlayerMeAvatar && Vector3 && (
//               <ReadyPlayerMeAvatar
//                 animationSrc="https://readyplayerme-assets.s3.amazonaws.com/animations/visage/male-idle.glb"
//                 onLoadedAnimation={{
//                   src: "https://readyplayerme-assets.s3.amazonaws.com/animations/visage/male-spawn-animation.fbx",
//                   loop: 4
//                 }}
//                 modelSrc={createUrlFromAvatarId(avatarId, "glb")}
//                 idleRotation={true}
//                 headMovement={true}
//                 scale={0.9}
//                 keyLightColor="#bca1f4"
//                 keyLightIntensity={1}
//                 fillLightColor="#8d4cf6"
//                 fov={50}
//                 emotion={{
//                   browInnerUp: 0.3,
//                   browOuterUpLeft: 0.37,
//                   browOuterUpRight: 0.49,
//                   eyeSquintLeft: 0.4,
//                   eyeSquintRight: 0.2,
//                   mouthShrugUpper: 0.27,
//                   mouthSmileLeft: 0.37,
//                   mouthSmileRight: 0.36
//                 }}
//                 cameraZoomTarget={new Vector3(0, 0.1, 3.2)}
//                 cameraInitialDistance={3.2}
//                 cameraTarget={1.55}
//                 className="h-full w-full"
//                 onLoaded={() => {
//                   setAvatarLoading(false);
//                   setAvatarError(false);
//                 }}
//                 shadows
//               />
//             )}
//           </motion.div>
//         </ClientOnly>
//       )}
//     </AnimatePresence>
//   );
// };

// export default ProfileAvatar;
