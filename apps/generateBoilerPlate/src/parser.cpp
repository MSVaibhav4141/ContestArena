#pragma once
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <cctype>

using namespace std;


int parseInt(const string& s) {
    return stoi(s);  // convert string "123" to int
}

long long parseLong(const string& s) {
    return stoll(s); // convert string "123456" to long long
}

double parseDouble(const string& s) {
    return stod(s);  // convert string "12.34" to double
}

bool parseBool(const string& s) {
    if(s == "true" || s == "1") return true;
    return false;
}

char parseChar(const string& s) {
    if(s.empty()) return '\0';
    if(s[0] == '"' || s[0] == '\'') return s[1]; // '"A"' -> 'A'
    return s[0];
}

string parseString(const string& s) {
    if(s.size() >= 2 && ((s.front() == '"' && s.back() == '"') || (s.front() == '\'' && s.back() == '\'')))
        return s.substr(1, s.size() - 2);
    return s;
}

// Helper to trim spaces
inline string trim(const string& s){
    size_t start = s.find_first_not_of(" \t\n\r");
    size_t end = s.find_last_not_of(" \t\n\r");
    return (start==string::npos) ? "" : s.substr(start, end-start+1);
}

vector<int> parseVectorInt(const string& s){
    vector<int> res; string temp;
    for(char c : s){
        if(c=='['||c==']') continue;
        else if(c==','){ if(!temp.empty()) { res.push_back(parseInt(trim(temp))); temp.clear(); } }
        else temp+=c;
    }
    if(!temp.empty()) res.push_back(parseInt(trim(temp)));
    return res;
}

vector<long long> parseVectorLong(const string& s){
    vector<long long> res; string temp;
    for(char c : s){
        if(c=='['||c==']') continue;
        else if(c==','){ if(!temp.empty()) { res.push_back(parseLong(trim(temp))); temp.clear(); } }
        else temp+=c;
    }
    if(!temp.empty()) res.push_back(parseLong(trim(temp)));
    return res;
}

vector<double> parseVectorDouble(const string& s){
    vector<double> res; string temp;
    for(char c : s){
        if(c=='['||c==']') continue;
        else if(c==','){ if(!temp.empty()) { res.push_back(parseDouble(trim(temp))); temp.clear(); } }
        else temp+=c;
    }
    if(!temp.empty()) res.push_back(parseDouble(trim(temp)));
    return res;
}

vector<bool> parseVectorBool(const string& s){
    vector<bool> res; string temp;
    for(char c : s){
        if(c=='['||c==']') continue;
        else if(c==','){ if(!temp.empty()) { res.push_back(parseBool(trim(temp))); temp.clear(); } }
        else temp+=c;
    }
    if(!temp.empty()) res.push_back(parseBool(trim(temp)));
    return res;
}

vector<char> parseVectorChar(const string& s){
    vector<char> res; string temp; bool inQuote=false;
    for(char c : s){
        if(c=='"') inQuote=!inQuote;
        else if(c==',' && !inQuote){ if(!temp.empty()){ res.push_back(temp[0]); temp.clear(); } }
        else if(c!='[' && c!=']' && !isspace(c)) temp+=c;
    }
    if(!temp.empty()) res.push_back(temp[0]);
    return res;
}

vector<string> parseVectorString(const string& s){
    vector<string> res; string temp; bool inQuote=false;
    for(char c : s){
        if(c=='"') inQuote=!inQuote;
        else if(c==',' && !inQuote){ if(!temp.empty()){ res.push_back(temp); temp.clear(); } }
        else if(c!='[' && c!=']') temp+=c;
    }
    if(!temp.empty()) res.push_back(temp);
    return res;
}


vector<vector<int>> parseGridInt(const string& s){
    vector<vector<int>> res; string temp; bool inBrackets=false;
    for(char c: s){
        if(c=='[' && !inBrackets){ inBrackets=true; temp.clear(); }
        else if(c==']'){ if(!temp.empty()){ res.push_back(parseVectorInt("["+temp+"]")); temp.clear(); } inBrackets=false; }
        else if(inBrackets) temp+=c;
    }
    return res;
}

vector<vector<long long>> parseGridLong(const string& s){
    vector<vector<long long>> res; string temp; bool inBrackets=false;
    for(char c: s){
        if(c=='[' && !inBrackets){ inBrackets=true; temp.clear(); }
        else if(c==']'){ if(!temp.empty()){ res.push_back(parseVectorLong("["+temp+"]")); temp.clear(); } inBrackets=false; }
        else if(inBrackets) temp+=c;
    }
    return res;
}

vector<vector<double>> parseGridDouble(const string& s){
    vector<vector<double>> res; string temp; bool inBrackets=false;
    for(char c: s){
        if(c=='[' && !inBrackets){ inBrackets=true; temp.clear(); }
        else if(c==']'){ if(!temp.empty()){ res.push_back(parseVectorDouble("["+temp+"]")); temp.clear(); } inBrackets=false; }
        else if(inBrackets) temp+=c;
    }
    return res;
}

vector<vector<bool>> parseGridBool(const string& s){
    vector<vector<bool>> res; string temp; bool inBrackets=false;
    for(char c: s){
        if(c=='[' && !inBrackets){ inBrackets=true; temp.clear(); }
        else if(c==']'){ if(!temp.empty()){ res.push_back(parseVectorBool("["+temp+"]")); temp.clear(); } inBrackets=false; }
        else if(inBrackets) temp+=c;
    }
    return res;
}

vector<vector<char>> parseGridChar(const string& s){
    vector<vector<char>> res; string temp; bool inBrackets=false;
    for(char c: s){
        if(c=='[' && !inBrackets){ inBrackets=true; temp.clear(); }
        else if(c==']'){ if(!temp.empty()){ res.push_back(parseVectorChar("["+temp+"]")); temp.clear(); } inBrackets=false; }
        else if(inBrackets) temp+=c;
    }
    return res;
}

vector<vector<string>> parseGridString(const string& s){
    vector<vector<string>> res; string temp; bool inBrackets=false;
    for(char c: s){
        if(c=='[' && !inBrackets){ inBrackets=true; temp.clear(); }
        else if(c==']'){ if(!temp.empty()){ res.push_back(parseVectorString("["+temp+"]")); temp.clear(); } inBrackets=false; }
        else if(inBrackets) temp+=c;
    }
    return res;
}

