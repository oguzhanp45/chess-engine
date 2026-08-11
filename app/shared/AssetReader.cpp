#include "AssetReader.h"

#ifdef __ANDROID__

#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>

namespace chessapp {
namespace {

JavaVM* g_vm = nullptr;
AAssetManager* g_assets = nullptr;
jobject g_assetManagerRef = nullptr;  // global ref: AAssetManager bu nesneye bağlı

AAssetManager* resolveAssetManager(JNIEnv* env) {
    jclass activityThread = env->FindClass("android/app/ActivityThread");
    if (activityThread == nullptr) { env->ExceptionClear(); return nullptr; }

    jmethodID currentApplication = env->GetStaticMethodID(
        activityThread, "currentApplication", "()Landroid/app/Application;");
    if (currentApplication == nullptr) { env->ExceptionClear(); return nullptr; }

    jobject application = env->CallStaticObjectMethod(activityThread, currentApplication);
    if (application == nullptr) { env->ExceptionClear(); return nullptr; }

    jclass contextClass = env->GetObjectClass(application);
    jmethodID getAssets = env->GetMethodID(
        contextClass, "getAssets", "()Landroid/content/res/AssetManager;");
    if (getAssets == nullptr) { env->ExceptionClear(); return nullptr; }

    jobject assetManager = env->CallObjectMethod(application, getAssets);
    if (assetManager == nullptr) { env->ExceptionClear(); return nullptr; }

    g_assetManagerRef = env->NewGlobalRef(assetManager);
    return AAssetManager_fromJava(env, g_assetManagerRef);
}

}  // namespace

void setJavaVM(JavaVM* vm) { g_vm = vm; }

std::vector<unsigned char> readAsset(const std::string& name) {
    std::vector<unsigned char> out;
    if (g_vm == nullptr) return out;

    JNIEnv* env = nullptr;
    bool attached = false;
    if (g_vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) != JNI_OK) {
        if (g_vm->AttachCurrentThread(&env, nullptr) != JNI_OK) return out;
        attached = true;
    }

    if (g_assets == nullptr) g_assets = resolveAssetManager(env);

    if (g_assets != nullptr) {
        AAsset* asset = AAssetManager_open(g_assets, name.c_str(), AASSET_MODE_STREAMING);
        if (asset != nullptr) {
            const off_t length = AAsset_getLength(asset);
            if (length > 0) {
                out.resize(static_cast<size_t>(length));
                size_t total = 0;
                while (total < out.size()) {
                    const int n = AAsset_read(asset, out.data() + total, out.size() - total);
                    if (n <= 0) break;
                    total += static_cast<size_t>(n);
                }
                out.resize(total);
            }
            AAsset_close(asset);
        }
    }

    if (attached) g_vm->DetachCurrentThread();
    return out;
}

}  // namespace chessapp

#else

namespace chessapp {
std::vector<unsigned char> readAsset(const std::string&) { return {}; }
}

#endif