#pragma once

#include <string>
#include <vector>

#ifdef __ANDROID__
#include <jni.h>
namespace chessapp {
// OnLoad.cpp bir kez çağırır; varlık okuma bu işaretçi olmadan çalışmaz.
void setJavaVM(JavaVM* vm);
}
#endif

namespace chessapp {
// Uygulama paketindeki assets klasöründen bir dosyayı okur.
// Bulunamazsa boş vektör döner. Android dışında her zaman boş.
std::vector<unsigned char> readAsset(const std::string& name);
}